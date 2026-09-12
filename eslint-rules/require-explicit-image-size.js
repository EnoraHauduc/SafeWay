const IMAGE_COMPONENTS = new Set(['Image', 'ImageBackground']);

function isReactNativeRequire(node) {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal' &&
    node.arguments[0].value === 'react-native'
  );
}

function propertyName(node) {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  return null;
}

function imageAttrs(attrs) {
  const result = { resizeMode: null, style: null };

  for (const attr of attrs) {
    if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') continue;
    if (attr.name.name === 'resizeMode') result.resizeMode = attr;
    if (attr.name.name === 'style') result.style = attr;
    if (result.resizeMode && result.style) break;
  }

  return result;
}

function attrExpression(attr) {
  if (!attr || !attr.value || attr.value.type !== 'JSXExpressionContainer') return null;
  return attr.value.expression;
}

function collectDimensions(node, found) {
  if (!node || (found.width && found.height)) return;

  if (node.type === 'ObjectExpression') {
    for (const prop of node.properties) {
      if (prop.type !== 'Property') continue;
      const name = propertyName(prop.key);
      if (name === 'width') found.width = true;
      if (name === 'height') found.height = true;
      if (found.width && found.height) return;
    }
  }

  if (node.type === 'ArrayExpression') {
    for (const element of node.elements) {
      collectDimensions(element, found);
      if (found.width && found.height) return;
    }
  }
}

function hasWidthAndHeight(styleAttr) {
  const found = { width: false, height: false };
  collectDimensions(attrExpression(styleAttr), found);
  return found.width && found.height;
}

function hasResizeMode(attr) {
  if (!attr || !attr.value) return false;

  if (attr.value.type === 'Literal') {
    return typeof attr.value.value === 'string' && attr.value.value.trim() !== '';
  }
  if (attr.value.type === 'JSXExpressionContainer') {
    return attr.value.expression && attr.value.expression.type !== 'JSXEmptyExpression';
  }

  return true;
}

function componentName(node) {
  if (node.type === 'JSXIdentifier') return node.name;

  const parts = memberExpressionParts(node);
  return parts ? `${parts.object}.${parts.property}` : 'Image';
}

function memberExpressionParts(node) {
  if (!node || node.type !== 'JSXMemberExpression') return null;
  if (node.object.type !== 'JSXIdentifier') return null;
  if (node.property.type !== 'JSXIdentifier') return null;
  return {
    object: node.object.name,
    property: node.property.name,
  };
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require explicit style dimensions and resizeMode on React Native Image/ImageBackground for reliable Expo web sizing',
    },
    fixable: null,
    schema: [],
  },
  create(context) {
    const localImageComponents = new Set();
    const reactNativeNamespaces = new Set();

    function isTrackedImageElement(name) {
      if (name.type === 'JSXIdentifier') {
        return localImageComponents.has(name.name);
      }

      const parts = memberExpressionParts(name);
      return (
        parts && reactNativeNamespaces.has(parts.object) && IMAGE_COMPONENTS.has(parts.property)
      );
    }

    function trackImport(node) {
      if (node.source.value !== 'react-native') return;

      for (const specifier of node.specifiers) {
        if (
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.type === 'Identifier' &&
          IMAGE_COMPONENTS.has(specifier.imported.name)
        ) {
          localImageComponents.add(specifier.local.name);
        }

        if (specifier.type === 'ImportNamespaceSpecifier') {
          reactNativeNamespaces.add(specifier.local.name);
        }
      }
    }

    function trackRequire(node) {
      if (!isReactNativeRequire(node.init)) return;

      if (node.id.type === 'Identifier') {
        reactNativeNamespaces.add(node.id.name);
        return;
      }

      if (node.id.type !== 'ObjectPattern') return;
      for (const prop of node.id.properties) {
        if (prop.type !== 'Property') continue;
        const imported = propertyName(prop.key);
        if (!IMAGE_COMPONENTS.has(imported)) continue;

        if (prop.value.type === 'Identifier') {
          localImageComponents.add(prop.value.name);
        }
      }
    }

    return {
      ImportDeclaration: trackImport,
      VariableDeclarator: trackRequire,
      JSXOpeningElement(node) {
        if (!isTrackedImageElement(node.name)) return;

        const missing = [];
        const attrs = imageAttrs(node.attributes);
        const name = componentName(node.name);

        if (!hasWidthAndHeight(attrs.style)) {
          missing.push('style={{ width, height }}');
        }
        if (!hasResizeMode(attrs.resizeMode)) {
          missing.push('resizeMode');
        }
        if (missing.length === 0) return;

        context.report({
          node,
          message: `React Native ${name} needs explicit ${missing.join(' and ')} for reliable Expo web image sizing; do not rely only on className/NativeWind/Uniwind classes.`,
        });
      },
    };
  },
};

module.exports = {
  meta: { name: 'media' },
  rules: {
    'require-explicit-image-size': rule,
  },
};
