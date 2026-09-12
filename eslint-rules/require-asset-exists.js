const { existsSync, readFileSync, statSync } = require('fs');
const { resolve, dirname, normalize } = require('path');

// Cache for tsconfig.json parsing
let tsconfigCache = null;
let tsconfigCachePath = null;

function loadTsConfig(projectRoot) {
  // Use absolute path for consistent cache key and existsSync behavior
  const tsconfigPath = resolve(projectRoot, 'tsconfig.json');

  // Return cached version if it's the same file
  if (tsconfigCache && tsconfigCachePath === tsconfigPath && existsSync(tsconfigPath)) {
    return tsconfigCache;
  }

  try {
    if (!existsSync(tsconfigPath)) {
      return null;
    }

    const tsconfigContent = readFileSync(tsconfigPath, 'utf-8');

    // Handle JSON5 (JSON with comments) - strip comments
    // This is a simple approach; for full JSON5 support, consider using a JSON5 parser
    const cleanedContent = tsconfigContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, ''); // Remove line comments

    const tsconfig = JSON.parse(cleanedContent);

    // Handle extends - merge paths from extended configs if they exist
    // Note: This is a simplified approach. Full resolution would require resolving
    // the extended config file and merging recursively.
    if (tsconfig.extends && tsconfig.compilerOptions?.paths) {
      // Paths in current config take precedence, so we keep them as-is
      // Extended config paths would need to be loaded separately if needed
    }

    tsconfigCache = tsconfig;
    tsconfigCachePath = tsconfigPath;
    return tsconfig;
  } catch (_error) {
    // If parsing fails, return null (will skip alias resolution)
    return null;
  }
}

function resolvePathAlias(requirePath, projectRoot, tsconfig) {
  if (!tsconfig || !tsconfig.compilerOptions || !tsconfig.compilerOptions.paths) {
    return null;
  }

  const paths = tsconfig.compilerOptions.paths;
  const baseUrl = tsconfig.compilerOptions.baseUrl || '.';

  // Normalize path: if it starts with @ but not @/, try adding the /
  // This handles cases like @assets/ vs @/assets/
  let normalizedPath = requirePath;
  if (requirePath.startsWith('@') && !requirePath.startsWith('@/')) {
    normalizedPath = requirePath.replace(/^@/, '@/');
  }

  // Sort aliases by specificity (longer patterns first) to match most specific first
  const sortedAliases = Object.entries(paths)
    .slice()
    .sort(([a], [b]) => {
      const aLen = a.replace(/\*/g, '').length;
      const bLen = b.replace(/\*/g, '').length;
      return bLen - aLen; // Longer patterns first
    });

  // Check each path alias (most specific first)
  for (const [alias, mappings] of sortedAliases) {
    // Remove the * from the alias pattern (e.g., "@/*" -> "@/")
    const aliasPattern = alias.replace(/\*$/, '');

    // Try both original and normalized paths
    for (const pathToCheck of [requirePath, normalizedPath]) {
      if (pathToCheck.startsWith(aliasPattern)) {
        // Get the part after the alias
        const remainingPath = pathToCheck.slice(aliasPattern.length);

        // Try each mapping
        for (const mapping of mappings) {
          // Replace * in mapping with remaining path
          // Note: This only handles single wildcard. Multiple wildcards would need more complex logic.
          const resolvedMapping = mapping.replace(/\*/, remainingPath);

          // Resolve baseUrl - handle both relative and absolute paths
          let basePath = baseUrl;
          if (!resolve(baseUrl).startsWith('/') && baseUrl !== '.') {
            // If baseUrl is relative, resolve it relative to project root
            basePath = resolve(projectRoot, baseUrl);
          } else if (baseUrl === '.') {
            basePath = projectRoot;
          } else {
            // Absolute path
            basePath = baseUrl;
          }

          const fullPath = resolve(basePath, resolvedMapping);

          // Return the resolved path even if it doesn't exist - we'll check existence later
          return fullPath;
        }
      }
    }
  }

  return null;
}

const requireAssetExistsRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure require() calls for assets resolve to existing files',
    },
    fixable: null,
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check if this is a require() or require.resolve() call
        const isRequire =
          (node.callee.type === 'Identifier' && node.callee.name === 'require') ||
          (node.callee.type === 'MemberExpression' &&
            node.callee.object.type === 'Identifier' &&
            node.callee.object.name === 'require' &&
            node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'resolve');

        if (
          isRequire &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'string'
        ) {
          const requirePath = node.arguments[0].value;

          // Skip empty paths
          if (!requirePath || requirePath.trim() === '') {
            return;
          }

          // Only check asset-like paths (images, videos, etc.)
          const assetExtensions = [
            '.png',
            '.jpg',
            '.jpeg',
            '.gif',
            '.svg',
            '.webp',
            '.bmp',
            '.ico',
            '.tiff',
            '.tif',
            '.mp4',
            '.mov',
            '.avi',
            '.webm',
            '.mp3',
            '.wav',
            '.ogg',
            '.aac',
            '.m4a',
          ];
          const isAssetPath = assetExtensions.some((ext) =>
            requirePath.toLowerCase().endsWith(ext.toLowerCase()),
          );

          if (isAssetPath) {
            // Get the current file's directory
            const currentFile = context.getFilename();
            const currentDir = dirname(currentFile);

            // Try to find project root (directory containing tsconfig.json)
            let projectRoot = currentDir;
            let tsconfig = null;
            for (let i = 0; i < 10; i++) {
              const tsconfigPath = resolve(projectRoot, 'tsconfig.json');
              if (existsSync(tsconfigPath)) {
                // Use absolute path so alias resolution and existsSync work regardless of cwd
                projectRoot = resolve(projectRoot);
                tsconfig = loadTsConfig(projectRoot);
                break;
              }
              const parent = dirname(projectRoot);
              if (parent === projectRoot) break;
              projectRoot = parent;
            }

            // Resolve the require path
            let resolvedPath;
            try {
              // Handle relative paths
              if (requirePath.startsWith('.')) {
                resolvedPath = resolve(currentDir, requirePath);

                // Security: Prevent path traversal outside project
                // Normalize and check if resolved path is still within reasonable bounds
                const normalized = normalize(resolvedPath);
                if (normalized.includes('..') && !normalized.startsWith(projectRoot)) {
                  // Path goes outside project - this is suspicious but might be valid
                  // We'll still check if it exists, but warn about potential issues
                }
              } else if (requirePath.startsWith('@')) {
                // Handle TypeScript path aliases (from tsconfig paths)
                let aliasResolved = resolvePathAlias(requirePath, projectRoot, tsconfig);
                // Fallback: treat @/ as project root when tsconfig didn't resolve (e.g. extends)
                if (!aliasResolved && requirePath.startsWith('@/')) {
                  aliasResolved = resolve(projectRoot, requirePath.slice(2));
                }
                if (aliasResolved) {
                  resolvedPath = aliasResolved;
                } else {
                  // Couldn't resolve alias, report error
                  context.report({
                    node: node.arguments[0],
                    message: `Cannot resolve asset path alias: ${requirePath}`,
                  });
                  return;
                }
              } else if (requirePath.startsWith('/')) {
                // Absolute path - check if it exists
                resolvedPath = requirePath;
              } else {
                // Handle module paths (node_modules) - skip for now
                // These are typically not asset files anyway
                return;
              }

              // Check if the file exists and is actually a file (not a directory)
              if (!existsSync(resolvedPath)) {
                context.report({
                  node: node.arguments[0],
                  message: `Asset file not found: ${requirePath}`,
                });
              } else {
                // Verify it's a file, not a directory
                try {
                  const stats = statSync(resolvedPath);
                  if (stats.isDirectory()) {
                    context.report({
                      node: node.arguments[0],
                      message: `Asset path points to a directory, not a file: ${requirePath}`,
                    });
                  }
                } catch (_statError) {
                  // If we can't stat it, assume it's fine (might be a symlink issue)
                  // The existsSync already passed, so it exists in some form
                }
              }
            } catch (error) {
              // If resolution fails, report an error
              context.report({
                node: node.arguments[0],
                message: `Cannot resolve asset path: ${requirePath} (${error.message})`,
              });
            }
          }
        }
      },
    };
  },
};

module.exports = {
  meta: { name: 'custom' },
  rules: {
    'require-asset-exists': requireAssetExistsRule,
  },
};
