const FORBIDDEN_METHOD = 'toSorted';

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Array.prototype.toSorted - not available in all React Native / Hermes runtimes; use .slice().sort() instead',
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.property.type === 'Identifier' &&
          node.property.name === FORBIDDEN_METHOD &&
          !node.computed
        ) {
          context.report({
            node: node.property,
            message: `${FORBIDDEN_METHOD} is not supported in this runtime. Use .slice().sort(...) instead.`,
          });
        }
      },
    };
  },
};

module.exports = {
  meta: { name: 'compat' },
  rules: {
    'no-to-sorted': rule,
  },
};
