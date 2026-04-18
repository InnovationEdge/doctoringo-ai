const path = require('path')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const webpack = require('webpack')

module.exports = merge(common, {
  mode: 'development',
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
  devtool: 'inline-source-map',
  cache: {
    type: 'filesystem',
    idleTimeout: 10000000,
    cacheDirectory: path.resolve(__dirname, '.temp_cache')
  },
  devServer: {
    port: 4000,
    historyApiFallback: true,
    hot: true,
    allowedHosts: [
      'knowhowai-local.test',
      'knowhowai-local.test:4000',
      'knowhow.ge',
      'www.knowhow.ge'
    ],
    static: {
      directory: path.resolve(__dirname, 'public/static'),
      publicPath: '/static'
    }
  },
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin({
        parallel: 4
      })
    ]
  }
})
