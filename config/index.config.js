const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');



module.exports = {
  mode: 'production',
  entry: './build_assets/build.js',
  output: {
    filename: 'bundle.min.js',
    path: path.resolve(__dirname, '..', 'public'),
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
        exclude: /node_modules/
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
    new MiniCssExtractPlugin({
      filename: 'styles.min.css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './html/customradio.webmanifest',
          to: '[name][ext]',
        },
        {
          from: './html/favicon.ico',
          to: '[name][ext]',
        },
        {
          from: './html/*.png',
          to: '[name][ext]',
        },
        {
          from: './html/screenshots',
          to: 'screenshots',
        },
      ],
    }),
  ],
};
