const path = require('path');
const tokens = require('./tokens.json');

module.exports = {
  content: [
    path.join(__dirname, '../../**/*.html'),
    path.join(__dirname, '../../**/*.js'),
    path.join(__dirname, '../../**/*.jsx'),
    path.join(__dirname, '../../**/*.ts'),
    path.join(__dirname, '../../**/*.tsx')
  ],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: {
        sans: [tokens.typography.fontFamily.sans]
      },
      fontSize: tokens.typography.fontSizes,
      lineHeight: tokens.typography.lineHeights,
      fontWeight: tokens.typography.fontWeight
    }
  },
  plugins: []
};
