const path = require('path')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name]-[contenthash].css',
      chunkFilename: '[id]-[contenthash].css'
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public/static'),
          to: path.resolve(__dirname, 'dist/static')
        }
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      // JavaScript minification with advanced optimizations
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.logs in production
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
            passes: 2 // Run compression twice for better results
          },
          mangle: {
            safari10: true // Fix Safari 10 issues
          },
          format: {
            comments: false // Remove all comments
          }
        },
        extractComments: false
      }),
      // CSS minification
      new CssMinimizerPlugin({
        parallel: 4,
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true }
            }
          ]
        }
      })
    ],
    // Advanced code splitting
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor bundle for node_modules
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        // Separate bundle for React and React-DOM
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'react',
          priority: 20,
          reuseExistingChunk: true
        },
        // Separate bundle for Ant Design
        antd: {
          test: /[\\/]node_modules[\\/]antd[\\/]/,
          name: 'antd',
          priority: 20,
          reuseExistingChunk: true
        },
        // Separate bundle for Firebase
        firebase: {
          test: /[\\/]node_modules[\\/]firebase[\\/]/,
          name: 'firebase',
          priority: 20,
          reuseExistingChunk: true
        },
        // Markdown rendering bundle
        markdown: {
          test: /[\\/]node_modules[\\/](react-markdown|remark-gfm)[\\/]/,
          name: 'markdown',
          priority: 15,
          reuseExistingChunk: true
        },
        // Common code shared between chunks
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          enforce: true
        }
      },
      // Maximum initial requests
      maxInitialRequests: 25,
      // Maximum async requests
      maxAsyncRequests: 25,
      // Minimum size for a chunk to be created (20kb)
      minSize: 20000
    },
    // Runtime chunk for better long-term caching
    runtimeChunk: {
      name: 'runtime'
    },
    // Module IDs optimization for better caching
    moduleIds: 'deterministic',
    // Use real content hash for better caching
    realContentHash: true,
    // Tree shaking optimization
    usedExports: true,
    sideEffects: false
  },
  // Use hidden source maps for production (smaller, no inline maps)
  devtool: 'hidden-source-map',
  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000, // 500 KB
    maxAssetSize: 512000 // 500 KB
  }
})
