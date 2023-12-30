const webpack      = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const path         = require('path')

module.exports = {
  entry: './src/globals.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'htaccess-tester.js',
    sourceMapFilename: 'htaccess-tester.map'
  },
  target: ['web'],
  mode: 'production',
  devtool: 'source-map',
  resolve: {
    modules: [
      path.resolve('./src'),
      path.resolve('./node_modules'),
      path.resolve('../node_modules')
    ],
    fallback: {
      "url": require.resolve("@warren-bank/url")
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env'
            ]
          }
        }
      }
    ]
  },
  optimization: {
    nodeEnv: 'production', 
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: true,
        terserOptions: {
          compress: true,
          sourceMap: true
        }
      }),
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ]
}
