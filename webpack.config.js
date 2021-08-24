const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

function resovle(dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  mode: 'development',
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin(), // 清理构建目录
    new CopyWebpackPlugin({
      parrerns: [{ 
        from: "public", 
        globOptions: { ignore: [resovle('./src/index.html')] } 
      }]
    }),
    new HtmlWebpackPlugin({ template: resovle('./src/index.html') }) // 自动生成html文件，并打打包好的js模块引入到该html中
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: true
            }
          },
          { loader: 'sass-loader' }
        ]
      }
    ]
  }
}
