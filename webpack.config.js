const path = require('path')
const htmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    port: 8081
  },
  module:{
    rules:[
        {
            test:/\.css$/,
            use:['style-loader','css-loader']
        }
    ],
  },
  plugins: [
      new htmlWebpackPlugin({
          template: path.join(__dirname, './src/index.html'),
          hash: true,
          filename: path.join(__dirname, './dist/index.html')
      })
  ]
}