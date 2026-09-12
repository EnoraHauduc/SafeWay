import { transform } from 'lightningcss';
import cssTree from 'css-tree';
import { globSync, readFileSync } from 'node:fs';

// Lints CSS with two parsers, both already installed (no new deps):
//   [build]  lightningcss — the exact parser uniwind/expo runs, so a throw here
//            means the build WILL break. The authoritative gate.
//   [syntax] css-tree — stricter recovery parser (same engine as the VSCode CSS
//            hints). Catches generic mistakes lightningcss silently tolerates
//            (unclosed braces, stray tokens) before they bite elsewhere.
// ponytail: stylelint was rejected — its postcss parser ACCEPTS the @layer decl
// bug that breaks the build, so it would miss the very error this guards against.
let failed = false;
const report = (msg) => {
  failed = true;
  console.error(msg);
};

for (const file of globSync('**/*.css', { exclude: ['**/node_modules/**'] })) {
  const code = readFileSync(file);

  try {
    transform({ code, filename: file });
  } catch (e) {
    report(`${file}:${e.loc?.line ?? '?'}:${e.loc?.column ?? '?'}  [build]  ${e.message}`);
  }

  cssTree.parse(code.toString(), {
    positions: true,
    onParseError: (e) => report(`${file}:${e.line}:${e.column}  [syntax] ${e.message}`),
  });
}

process.exit(failed ? 1 : 0);
