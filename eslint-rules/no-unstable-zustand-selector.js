const FRESH_ARRAY_METHODS = new Set([
  'filter',
  'map',
  'slice',
  'concat',
  'flat',
  'flatMap',
  'sort',
  'reverse',
  'toReversed',
  'toSpliced',
  'with',
  'split',
  'splice',
]);

const STATIC_FRESH_PRODUCERS = {
  Array: new Set(['from', 'of']),
  Object: new Set(['values', 'keys', 'entries', 'fromEntries', 'assign']),
};

function returnsFreshReference(node) {
  if (!node) return false;
  if (node.type === 'ObjectExpression') return true;
  if (node.type === 'ArrayExpression') return true;
  if (node.type === 'CallExpression') {
    const c = node.callee;
    if (c.type === 'MemberExpression' && c.property.type === 'Identifier') {
      if (FRESH_ARRAY_METHODS.has(c.property.name)) return true;
      if (
        c.object.type === 'Identifier' &&
        STATIC_FRESH_PRODUCERS[c.object.name]?.has(c.property.name)
      ) {
        return true;
      }
    }
  }
  if (node.type === 'ConditionalExpression') {
    return returnsFreshReference(node.consequent) || returnsFreshReference(node.alternate);
  }
  if (node.type === 'LogicalExpression') {
    return returnsFreshReference(node.left) || returnsFreshReference(node.right);
  }
  return false;
}

function collectReturnNodes(funcNode) {
  if (!funcNode.body) return [];
  if (funcNode.body.type !== 'BlockStatement') return [funcNode.body];
  const out = [];
  walk(funcNode.body, out);
  return out;
}

function walk(node, out) {
  if (!node || typeof node !== 'object') return;
  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    return;
  }
  if (node.type === 'ReturnStatement' && node.argument) out.push(node.argument);
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue;
    const v = node[key];
    if (Array.isArray(v)) {
      for (const c of v) walk(c, out);
    } else if (v && typeof v === 'object' && v.type) {
      walk(v, out);
    }
  }
}

function isUseShallowWrap(node) {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'useShallow'
  );
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Zustand selectors that return fresh references must be wrapped in useShallow to avoid infinite re-render loops',
    },
    fixable: null,
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier') return;
        if (!/^use[A-Z][A-Za-z0-9]*Store$/.test(node.callee.name)) return;
        if (node.arguments.length === 0) return;

        const arg = node.arguments[0];
        if (isUseShallowWrap(arg)) return;

        if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
          const returns = collectReturnNodes(arg);
          if (returns.some(returnsFreshReference)) {
            context.report({
              node: arg,
              message: `Selector passed to ${node.callee.name} returns a fresh reference (object/array literal or .filter/.map/.slice/etc). Wrap it in useShallow() from 'zustand/react/shallow' or it will cause an infinite re-render loop.`,
            });
          }
          return;
        }

        if (arg.type === 'Identifier') {
          context.report({
            node: arg,
            message: `Selector '${arg.name}' is passed to ${node.callee.name} as a bare reference and cannot be statically analyzed. If it derives an array/object (e.g., uses .filter/.map/.slice or builds a new object), wrap it in useShallow() from 'zustand/react/shallow' to avoid an infinite re-render loop.`,
          });
        }
      },
    };
  },
};

module.exports = {
  meta: { name: 'store' },
  rules: {
    'no-unstable-zustand-selector': rule,
  },
};
