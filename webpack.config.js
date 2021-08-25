const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

function resovle(dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  // entry: '', // 入口
  // output: {
  //   path: resovle(''),
  //   filename: ''  
  // }, // 出口
  mode: 'development',
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin(), // 清理构建目录
    // new CopyWebpackPlugin({
    //   parrerns: [{ 
    //     from: 'public', 
    //     globOptions: { ignore: [resovle('./src/index.html')] } 
    //   }]
    // }),
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
  },
  devServer: {
    contentBase: 'dist',
    prot: 3000,
    proxy: {
      '/server': {
        target: '', // 代理的目标地址
        pathRewrite: '', // 默认情况下，我们的 /server 也会被写入URL中，如果希望删除，可以使用重写
        secure: true, // 默认情况下不接受转发到https的服务器上，如果希望支持，可以设置为false
        changeOrigin: false // 它表示是够更新代理后请求的 headers 中的host地址
      }
    }
  }
}
