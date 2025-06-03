const path = require('path');
const packageJson = require('../package.json'); // Import package.json

// Function to create externals object from dependencies
const nodeModules = {};
if (packageJson.dependencies) {
  for (const key in packageJson.dependencies) {
    nodeModules[key] = 'commonjs ' + key;
  }
}

module.exports = {
  mode: 'production',
  entry: './index.js',
  target: 'node',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
  // Exclude all node_modules dependencies
  externals: nodeModules,
};