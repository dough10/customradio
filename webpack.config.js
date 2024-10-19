const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlCriticalWebpackPlugin = require('html-critical-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './build_assets/build.js',
  output: {
    filename: 'bundle.min.js',
    path: path.resolve(__dirname, 'html'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
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
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: 'body',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        minifyCSS: true,
        minifyJS: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.min.css',
    }),
    new HtmlCriticalWebpackPlugin({
      base: path.resolve(__dirname, 'html'),
      src: 'index.html',
      dest: 'index.html',
      inline: true,
      minify: true,
      extract: true,
      width: 1280,
      height: 800,
      penthouse: {
        blockJSRequests: false,
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './src/worker.js',
          to: '[name][ext]',
        },
        {
          from: './src/customradio.webmanifest',
          to: '[name][ext]',
        },
        {
          from: './src/favicon.ico',
          to: '[name][ext]',
        },
        {
          from: './src/*.png',
          to: '[name][ext]',
        },
        {
          from: './src/screenshots',
          to: 'screenshots',
        },
      ],
    }),
  ],
};
