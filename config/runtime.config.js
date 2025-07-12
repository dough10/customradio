const path = require('path');
const packageJson = require('../package.json'); // Import package.json

const nodeModules = {};
if (packageJson.dependencies) {
  for (const key in packageJson.dependencies) {
    nodeModules[key] = 'commonjs ' + key;
  }
}

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  target: 'node',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, '..', 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
  externals: nodeModules
};