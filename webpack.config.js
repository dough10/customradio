const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/js/main.js', // Entry point for JavaScript
  output: {
    filename: 'bundle.min.js', // Output JavaScript file
    path: path.resolve(__dirname, 'html'), // Output directory
  },
  module: {
    rules: [
      {
        test: /\.css$/, // Apply to .css files
        use: [
          MiniCssExtractPlugin.loader, // Extract CSS into a separate file
          'css-loader', // Process CSS files
        ],
      },
      {
        test: /\.js$/, // Apply to .js files
        exclude: /node_modules/, // Exclude node_modules directory
        use: {
          loader: 'babel-loader', // Transpile JavaScript files
          options: {
            presets: ['@babel/preset-env'], // Use Babel preset for JavaScript
          },
        },
      },
    ],
  },
  optimization: {
    minimize: true, // Minify the output files
    minimizer: [
      new TerserPlugin(), // Minify JavaScript
      new CssMinimizerPlugin(), // Minify CSS
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), // Clean the output directory before each build
    new HtmlWebpackPlugin({
      template: './src/index.html', // Template HTML file
      inject: 'body', // Inject script tags into the body of the HTML
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        minifyCSS: true,
        minifyJS: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.min.css', // Output CSS file
    }),
  ],
};
