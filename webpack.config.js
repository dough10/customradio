const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
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
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './src/worker.js',
          to: 'worker.js'
        }, {
          from: './src/customradio.webmanifest',
          to: 'customradio.webmanifest'
        }, {
          from: './src/favicon.ico',
          to: 'favicon.ico'
        }, {
          from: './src/favicon-16x16.png',
          to: 'favicon-16x16.png'
        }, {
          from: './src/favicon-32x32.png',
          to: 'favicon-32x32.png'
        }, {
          from: './src/apple-touch-icon.png',
          to: 'apple-touch-icon.png'
        }, {
          from: './src/android-chrome-512x512.png',
          to: 'android-chrome-512x512.png'
        }, {
          from: './src/android-chrome-192x192.png',
          to: 'android-chrome-192x192.png'
        }, {
          from: './src/robots.txt',
          to: 'robots.txt'
        }, {
          from: './src/screenshots',
          to: 'screenshots'
        }, {
          from: './src/sitemap.xml',
          to: 'sitemap.xml'
        }, {
          from: './src/.well-known',
          to: '.well-known'
        }
      ],
    }),
  ],
};
