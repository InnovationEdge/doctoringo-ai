const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const Dotenv = require('dotenv-webpack')

const abs = (str) => path.resolve(__dirname, str)

module.exports = {
  entry: {
    'index': './src/index.tsx'
  },
  stats: {
    colors: true,
    modules: true,
    reasons: true,
    errorDetails: true
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        '**/*', '!.htaccess', '!.gitignore', '!sw.js', '!metadata.json', '!bootstrap.min.css', '!tinymce/**', '!static/**', '!.well-known/**'
      ],
      protectWebpackAssets: false,
      cleanAfterEveryBuildPatterns: ['*.LICENSE.txt']
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      favicon: 'src/assets/media/images/favicon.ico',
      title: 'KnowHow AI - ქართული იურიდიული დახმარება',
      inject: 'body',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),
    new MiniCssExtractPlugin({
      filename: '[name]-[contenthash].css'
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/assets/media/images/favicon-32x32.png', to: 'favicon-32x32.png' },
        { from: 'src/assets/media/images/favicon-16x16.png', to: 'favicon-16x16.png' },
        { from: 'src/assets/media/images/apple-touch-icon.png', to: 'apple-touch-icon.png' }
      ]
    }),
    new Dotenv(),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(process.env.REACT_APP_API_BASE_URL || 'https://api.knowhow.ge'),
      'process.env.REACT_APP_FIREBASE_API_KEY': JSON.stringify(process.env.REACT_APP_FIREBASE_API_KEY),
      'process.env.REACT_APP_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN),
      'process.env.REACT_APP_FIREBASE_PROJECT_ID': JSON.stringify(process.env.REACT_APP_FIREBASE_PROJECT_ID),
      'process.env.REACT_APP_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET),
      'process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID),
      'process.env.REACT_APP_FIREBASE_APP_ID': JSON.stringify(process.env.REACT_APP_FIREBASE_APP_ID),
      'process.env.REACT_APP_FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.REACT_APP_FIREBASE_MEASUREMENT_ID)
    })
  ],
  output: {
    filename: '[name]-[contenthash].js',
    path: path.resolve(__dirname, 'public'),
    pathinfo: false,
    publicPath: '/'
  },
  resolve: {
    modules: [
      abs('node_modules'),
      abs('src'),
      abs('.')
    ],
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(pdf)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource'
      }
    ]
  },
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    usedExports: true, // Enable tree shaking
    sideEffects: true, // Respect package.json sideEffects field
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        // Ant Design in separate chunk for better caching
        antd: {
          test: /[\\/]node_modules[\\/](antd|@ant-design|rc-.*|async-validator)[\\/]/,
          name: 'antd',
          priority: 30,
          reuseExistingChunk: true
        },
        // React and related libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
          name: 'react',
          priority: 20,
          reuseExistingChunk: true
        },
        // OpenAI and markdown rendering
        markdown: {
          test: /[\\/]node_modules[\\/](react-markdown|remark-.*|unified|unist-.*|mdast-.*|micromark.*)[\\/]/,
          name: 'markdown',
          priority: 15,
          reuseExistingChunk: true
        },
        // Other vendor code
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        // Common code shared between pages
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          enforce: true
        }
      }
    }
  }
}
