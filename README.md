### 1、常用的 loader
```
  * style-loader：将css添加到DOM的内联样式标签style里
  * css-loader：允许将css文件通过模块的方式引用，并返回css代码
  * sass-loader/less-loader：处理sass/less
  * postcss-loader：用postcss处理CSS
  * file-loader：分发文件到output目录并但会绝对路径
  * url-loader：和file-loader类似，但是当文件小玉设定的limit时可以返回一个Date Url
  * html-minify-loader：压缩HTML
  * bable-loader：用bable来转换es6-es5
```

### 2、常用的plugin
```
  * html-webpack-plugin：在打包结束后，自动生成一个html文件，并将打包生成的js模板引入到该html中
  * clean-webpack-plugin：删除、清理构建目录
  * mini-css-extract-plugin：提取css到一个单独的文件中
  * copy-webpack-plugin 复制文件或目录到执行区域，如vue的打包过程中，如果我们将一些文件放到public的目录下，那么这个目录会被复制到dist文件夹下
    from：设置从哪一个源中开始复制
    to：复制到的位置，可以省略，会默认复制到打包的目录下
    globOptions：设置一些额外的选项，其实可以编写需要的忽略文件
```
