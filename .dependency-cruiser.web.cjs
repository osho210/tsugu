/** @type {import('dependency-cruiser').IConfiguration} */
const baseConfig = require('./.dependency-cruiser.cjs');

module.exports = {
  ...baseConfig,
  options: {
    ...baseConfig.options,
    tsConfig: {
      fileName: 'tsconfig.dependency-cruiser.web.json',
    },
  },
};
