# 手写webpack

```
yarn add @babel/parser
yarn add @babel/traverse
yarn add @babel/core
yarn add @babel/preset-env
```


```js
const fs = require("fs");
const path = require("path");
// 用 @babel/parser 转换语法树
const parser = require("@babel/parser");
// 用 @babel/traverse 做依赖分析
const traverse = require("@babel/traverse").default;
// 核心包 ES6到ES5的转化
const babel = require("@babel/core");

/**
 * 分析模块
 * @param {*} file
 */
function getModuleInfo(file) {
    // 读取文件
    const body = fs.readFileSync(file, "utf-8"); // 同步读取

    // 转换 AST 语法树
    const ast = parser.parse(body, {
        sourceType: "module", // ES模块
    });

    // 收集依赖 { './add.js': './src\\add.js' }
    const deps = {};
    traverse(ast, {
        ImportDeclaration({ node }) {
            // 取出文件所在路径 ./src
            const dirname = path.dirname(file);
            // 计算绝对路径  ./src/add.js
            const abspath = "./" + path.join(dirname, node.source.value);
            // node.source.value 相对路径 ./add.js
            deps[node.source.value] = abspath;
        }
    })

    // ES6转换ES5
    const { code } = babel.transformFromAst(ast, null, {
        presets: ['@babel/preset-env']
    })

    const moduleInfo = {
        file,
        deps,
        code
    }
    return moduleInfo
}

// 生成依赖图
function pathModules(file) {
    // 从入口开始
    const entry = getModuleInfo(file);
    // 在最终生成依赖图之前，暂存模块信息
    const temp = [entry];
    // 依赖关系图
    const depsGraph = {}

    getDeps(temp, entry)

    // 组装依赖图
    temp.forEach(info => {
        depsGraph[info.file] = {
            deps: info.deps,
            code: info.code
        }
    })

    return depsGraph
}

// deps { './add.js': './src/add.js' } {相对路径：绝对路径}
// 递归获取依赖模块信息
function getDeps(temp, { deps }) {
    Object.keys(deps).forEach(key => {
        const child = getModuleInfo(deps[key])
        temp.push(child);
        getDeps(temp, child)
    })
}

function bundle(file) {
    const depsGraph = JSON.stringify(pathModules(file));
    return `(function (graph) {
                function require(file) {
                    function absRequire(relPath) {
                        return require(graph[file].deps[relPath])
                    }
                    var exports = {};
                    (function (require,exports,code) {
                        eval(code)
                    })(absRequire,exports,graph[file].code)
                    return exports
                }
                require('${file}')
            })(${depsGraph})`;
}
let content = bundle('./src/index.js');
// 写入 /dist 文件夹

!fs.existsSync('./dist') && fs.mkdirSync('./dist');
fs.writeFileSync('./dist/bundle.js',content)
```







# 0、构成

## Entry

入口起点(entry point)指示 webpack 应该使用哪个模块,来作为构建其内部依赖图的开始。

进入入口起点后,webpack 会找出有哪些模块和库是入口起点（直接和间接）依赖的。

每个依赖项随即被处理,最后输出到称之为 bundles 的文件中。

## Output

output 属性告诉 webpack 在哪里输出它所创建的 bundles,以及如何命名这些文件,默认值为 ./dist。

基本上,整个应用程序结构,都会被编译到你指定的输出路径的文件夹中。

## Module

模块,在 Webpack 里一切皆模块,一个模块对应着一个文件。Webpack 会从配置的 Entry 开始递归找出所有依赖的模块。

## Chunk

代码块,一个 Chunk 由多个模块组合而成,用于代码合并与分割。

## Loader

loader 让 webpack 能够去处理那些非 JavaScript 文件（webpack 自身只理解 JavaScript）。

loader 可以将所有类型的文件转换为 webpack 能够处理的有效模块,然后你就可以利用 webpack 的打包能力,对它们进行处理。

本质上,webpack loader 将所有类型的文件,转换为应用程序的依赖图（和最终的 bundle）可以直接引用的模块。

## Plugin

loader 被用于转换某些类型的模块,而插件则可以用于执行范围更广的任务。

插件的范围包括,从打包优化和压缩,一直到重新定义环境中的变量。插件接口功能极其强大,可以用来处理各种各样的任务。

## externals

外部引入 cdn ，不需要打包

## watch

> watch: true
>
> 代码变化，实时打包



## resolve

> 解析 第三方包



# 1、原理

## 1.1、工作流程

> 把所有的要解析的模块变成对象 key->路径 value-> 函数
>
> 通过唯一入口加载
>
> 依次实现递归关系
>
> 然后将所有这些模块打包成一个或多个 bundle。









# 2、配置

## 2.1、基础配置

###安装本地webpack

- webpack webpack-cli -D  开发环境使用
- yarn add webpack webpack-cli -D

### webpack可以进行0配置

- 打包工具 -> 输出后的结果（js模块）
- 打包（支持js模块化）

### 手动配置webpack

- 默认配置文件名字 webpack.config.js

  - webpack 是node写出来的 node 的写法运行

- 手动指定配置文件打包

  - npx webpack --config webpack.config.my.js

  - 或者配置 "script":{

    ​						"build": "webpack --config webpack.config.my.js"

    ​					}



## 2.2、配置示例

```js
// webpack 是node写出来的 node 的写法运行

const path = require('path')
let HtmlWebpackPlugin = require('html-webpack-plugin')
let MiniCssExtractPlugin = require('mini-css-extract-plugin')
let OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
let UglifyJsPlugin = require('uglifyjs-webpack-plugin')
let webpack = require('webpack')

module.exports = {
    optimization:  { // 优化项
        minimizer: [
            new UglifyJsPlugin({ // js 代码压缩
                cache: true, // 缓存
                parallel: true, // 并发打包
                sourceMap: true, // 调试使用 源码映射
            }),
            new OptimizeCssAssetsWebpackPlugin(), // css 代码压缩
        ]
    },
    mode: 'production', // 模式 默认两种 production development 
    entry: './src/index.js', // 入口
    output: {
        filename: 'js/bundle.js', // 打包后的文件名 [hash]每次文件修改都会产生新的文件 [hash:8] 8位hash值
        path: path.resolve(__dirname, 'dist'), // 打包后的路径 必须是绝对路径
        // publicPath: 'https://baidu.com', // 公共路径 引用资源时候统一给加上
    },
    plugins: [ // 放着所有插件
        new HtmlWebpackPlugin({ // 生成html插件
            template: path.join(__dirname, './index.html'), // 模板路径
            filename: 'index.html', // 打包后的名称
            // minify: { // html 压缩配置
            //     removeAttributeQuotes: true, // 删除属性的双引号 ""
            //     collapseWhitespace: true, // 折叠空行，变成一行
            // },
            minify: false,
            hash: true, // 引用加个hash戳，处理缓存问题
        }),
        new MiniCssExtractPlugin({
            filename: 'css/main.css' // css下的main.css
        }),
        new webpack.ProvidePlugin({ // 在每个模块中都注入 $
            $: 'jquery'
        })
    ],
    watch: false, // 代码变化，实时打包
    watchOptions: { // 监控的选项
        poll: 1000, // 每秒 问我1000次
        aggregateTimeout: 500, // 防抖
        ignored: /node_modules/ // 不需要进行监控的文件
    }
    module: { // 模块 解析非js文件
        rules: [ // 规则 
            {
                test: /\.html$/,
                use: 'html-withimg-loader'
            },
            {
                test: /\.js$/,
                use: {
                    loader: 'eslint-loader',
                    options: {
                        enforce: 'pre', // previous->强制在babel-loader之前执行,post->在普通loader之后执行  loader从右向左执行，从下向上执行
                    }
                },
                include: [path.resolve(__dirname, 'src')],
                exclude: [/node_modules/]
                
            },
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader', // 默认普通loader normal
                    options: { // 用 babel-loader 需要把es6 转 es5
                        presets: [ // 插件集合
                            ['@babel/preset-env', {
                                'useBuiltIns': 'usage',
                                'targets': {
                                    'chrome': '58',
                                    'ie': '9'
                                },
                                'corejs': '3'
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-transform-runtime'
                        ]
                    }
                },
                include: path.resolve(__dirname, 'src'), // 包括 src
                exclude: /node_modules/, // 排除 node_modules
            },            
            {
                test: /\.css$/, // 正则--以.css结尾的
                use: [
                    MiniCssExtractPlugin.loader, // 把抽离的css文件以link标签形式插入
                    'css-loader',
                    'postcss-loader'
                ]
            },
            {
                test: /\.less$/, // 正则--以.less结尾的
                use: [
                    MiniCssExtractPlugin.loader, // 把抽离的css文件以link标签形式插入
                    'css-loader', // @import 解析路径
                    'less-loader', // 把less -> css
                    'postcss-loader', // 自动添加浏览器前缀
                ]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        esModule: false,
                        limit: 1, // 200*1024 200k
                        outputPath: '/img/', // 图片输出路径
                        publicPath: 'http://baidu.com' // 公共路径 引用 图片 资源时候统一给加上 如 cdn
                    }
                }
            }
        ]
    },
    externals: { // 外部引入 cdn ，不需要打包
        jquery: 'jQuery'
    },
    devServer: { // 开发服务器配置
        port: 4000,
        progress: true, // 打包进度条
        contentBase: './dist', // 以contentBase目录运行静态服务
        open: true, // 自动打开web页面
        compress: true, // 压缩
    },
}
```







# 3、优化



## 1、**合理使用loader**

用 include 或 exclude 来帮我们避免不必要的转译，优化loader的管辖范围，比如 webpack 官方在介绍 babel-loader 时给出的示例：

```js
module: {
  rules: [
    {
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }
  ]
}

```

## 2、**缓存babel编译过的文件**

```js
loader: 'babel-loader?cacheDirectory=true'
```

如上，我们只需要为 loader 增加相应的参数设定。选择开启缓存将转译结果缓存至文件系统，则至少可以将 babel-loader 的工作效率提升两倍。

## 3、**DllPlugin类库引入**

处理第三方库的姿势有很多，其中，Externals 会引发重复打包的问题；而CommonsChunkPlugin 每次构建时都会重新构建一次 vendor；出于对效率的考虑，我DllPlugin是最佳选择。

DllPlugin 是基于 Windows 动态链接库（dll）的思想被创作出来的。这个插件会把第三方库单独打包到一个文件中，这个文件就是一个单纯的依赖库。这个依赖库不会跟着你的业务代码一起被重新打包，只有当依赖自身发生版本变化时才会重新打包。

用 DllPlugin 处理文件，要分两步走：

*1 基于 dll 专属的配置文件，打包 dll 库。*

*2 基于 webpack.config.js 文件，打包业务代码。*

以一个基于 React 的简单项目为例，我们的 dll 的配置文件可以编写如下：

```js
const path = require('path')
const webpack = require('webpack')

module.exports = {
    entry: {
      // 依赖的库数组
      vendor: [
        'prop-types',
        'babel-polyfill',
        'react',
        'react-dom',
        'react-router-dom',
      ]
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js',
      library: '[name]_[hash]',
    },
    plugins: [
      new webpack.DllPlugin({
        // DllPlugin的name属性需要和libary保持一致
        name: '[name]_[hash]',
        path: path.join(__dirname, 'dist', '[name]-manifest.json'),
        // context需要和webpack.config.js保持一致
        context: __dirname,
      }),
    ],
}
```

编写完成之后，运行这个配置文件，我们的 dist 文件夹里会出现这样两个文件：

vendor-manifest.json

vendor.js

vendor.js 不必解释，是我们第三方库打包的结果。这个多出来的 vendor-manifest.json，则用于描述每个第三方库对应的具体路径，我这里截取一部分给大家看下：

```js
{
  "name": "vendor_397f9e25e49947b8675d",
  "content": {
    "./node_modules/core-js/modules/_export.js": {
      "id": 0,
        "buildMeta": {
        "providedExports": true
      }
    },
    "./node_modules/prop-types/index.js": {
      "id": 1,
        "buildMeta": {
        "providedExports": true
      }
    },
    ...
  }
}
```

随后，我们只需在 *webpack.config.js* 里针对 dll 稍作配置：

```js
const path = require('path');
const webpack = require('webpack')
module.exports = {
  mode: 'production',
  // 编译入口
  entry: {
    main: './src/index.js'
  },
  // 目标文件
  output: {
    path: path.join(__dirname, 'dist/'),
    filename: '[name].js'
  },
  // dll相关配置
  plugins: [
    new webpack.DllReferencePlugin({
      context: __dirname,
      // manifest就是我们第一步中打包出来的json文件
      manifest: require('./dist/vendor-manifest.json'),
    })
  ]
}
```

像dll第三方类库的本质也是减少打包类库次数 ， 实现代码抽离 ，减少打包以后的文件体积。

4、**happypack多进程编译**

我们都知道nodejs是单线程。无法一次性执行多个任务。这样会使得所有任务都排队执行。happypack可以根据cpu核数优势，建立子进程child_process,充分利用多核优势解决这个问题。提高了打包的效率。

```js
const HappyPack = require('happypack')
// 手动创建进程池
const happyThreadPool =  HappyPack.ThreadPool({ size: os.cpus().length })

module.exports = {
  module: {
    rules: [
      ...
      {
        test: /\.js$/,
        // 问号后面的查询参数指定了处理这类文件的HappyPack实例的名字
        loader: 'happypack/loader?id=happyBabel',
        ...
      },
    ],
  },
  plugins: [
    ...
    new HappyPack({
      // 这个HappyPack的“名字”就叫做happyBabel，和楼上的查询参数遥相呼应
      id: 'happyBabel',
      // 指定进程池
      threadPool: happyThreadPool,
      loaders: ['babel-loader?cacheDirectory']
    })
  ],
}
```

happypack成功，启动了三个进程编译。加快了loader的加载速度。

## 5、**scope Hoisting**

scope Hoisting的作用是分析模块之前的依赖关系 ， 把打包之后的公共模块合到同一个函数中去。它会代码体积更小，因为函数申明语句会产生大量代码；代码在运行时因为创建的函数作用域更少了，内存开销也随之变小。

```js
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');

module.exports = {
  resolve: {
    // 针对 Npm 中的第三方模块优先采用 jsnext:main 中指向的 ES6 模块化语法的文件
    mainFields: ['jsnext:main', 'browser', 'main']
  },
  plugins: [
    // 开启 Scope Hoisting
    new ModuleConcatenationPlugin(),
  ],
};
```

## 6、**tree Shaking 删除冗余代码**

UglifyJsPlugin

```js
let OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
let UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
    ...
    optimization:  { // 优化项
        minimizer: [
            new UglifyJsPlugin({ // js 代码压缩
                cache: true, // 缓存
                parallel: true, // 并发打包
                sourceMap: true, // 调试使用 源码映射
            }),
            new OptimizeCssAssetsWebpackPlugin(), // css 代码压缩
        ]
    },
    devServer: { // 开发服务器配置
        port: 4000,
        progress: true, // 打包进度条
        contentBase: './dist', // 以contentBase目录运行静态服务
        open: true, // 自动打开web页面
        compress: true, // 压缩
    },
}
```

## 7、提取公共代码 CommonsChunkPlugin

> CommonsChunkPlugin

- 在plugins节点中新建一个CommonsChunkPlugin实例
  - `new webpack.optimize.CommonsChunkPlugin(options);`
- CommonsChunkPlugin方法中参数是一个对象，对象属性有:
  - name:提取公共代码的js文件名，如：common
  - names:字符串数组，打包的文件名称
  - minChunks: 指定重复代码几次之后就提取出来
  - chunks:// 指定提取范围

```js
var webpack = require('webpack');
var path = require('path');
module.exports = {
    entry: {
        'subPageA': './src/subPageA', // 公共代码提取是针对多entry的，在单一entry下是体现不出来的
        'subPageB': './src/subPageB'
    },
    output: {
        path: path.resolve(__dirname, './dist'), //__dirname 代表当前目录
        filename: "[name].bundle.js"
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'common', // 如果还要提取公共代码,在新建一个实例
            minChunks: 2, //重复两次之后就提取出来
            chunks: ['subPageA', 'subPageB'] // 指定提取范围
        })
    ]
}
```

```js
var webpack = require('webpack');
var path = require('path');
module.exports = {
    entry: {
        'subPageA': './src/subPageA', // 公共代码提取是针对多entry的，在单一entry下是体现不出来的
        'subPageB': './src/subPageB',
        'vendor': ['lodash'] // 打包第三方代码
    },
    output: {
        path: path.resolve(__dirname, './dist'), //__dirname 代表当前目录
        filename: "[name].bundle.js",
        chunkFilename: "[name].chunk.js"
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'common', // 如果还要提取公共代码,在新建一个实例
            minChunks: 2, //重复两次之后就提取出来
            chunks:['pageA','pageB'] // 指定提取范围
        }),
        new webpack.optimize.CommonsChunkPlugin({ // 提取第三方代码
            name: 'vendor', 
            minChunks: Infinity
        })
    ]
}
```









# 4、常用plugin

## html-webpack-plugin 生成html插件

> 生成html插件

```
yarn add html-webpack-plugin -D
```

```js
const path = require('path')
let HtmlWebpackPlugin = require('html-webpack-plugin')

...
    plugins: [ // 放着所有插件
        ...
        new HtmlWebpackPlugin({ // 生成html插件
            template: path.join(__dirname, './index.html'), // 模板路径
            filename: 'index.html', // 打包后的名称
            minify: false, 
            // minify: { // html 压缩配置
                // removeAttributeQuotes: true, // 删除属性的双引号 ""
                // collapseWhitespace: true, // 折叠空行，变成一行
            // },
            hash: true, // 引用加个hash戳，处理缓存问题
        })
    ],
```

## mini-css-extract-plugin 把css内容抽离成单独的文件

> 把css内容抽离成单独的文件
>
> 在module中，使用MiniCssExtractPlugin.loader将 抽离的css文件以link方式插入html

```js
...
    plugins: [ // 放着所有插件
        ...
		new MiniCssExtractPlugin({
            filename: 'css/main.css' // css下的main.css
        })
    ],
    module: {
        rules: [ // 规则 
            {

                test: /\.css$/, // 正则--以.css结尾的
                use: [
                    MiniCssExtractPlugin.loader, // 把抽离的css文件以link标签形式插入
                    'css-loader'
                ]
            },
            {
                test: /\.less$/, // 正则--以.less结尾的
                use: [
                    MiniCssExtractPlugin.loader, // 把抽离的css文件以link标签形式插入
                    'css-loader', // @import 解析路径
                    'less-loader' // 把less -> css
                ]
            }
        ]
    }
```

## optimize-css-assets-webpack-plugin 代码压缩 css js

> 代码压缩 css js
>
> 可能会与postcss-loader 冲突导致build失败，检查安装该plugin时的warn信息，安装高版本postcss
>
> 使用该插件会导致js不进行压缩，需要安装并使用 uglifyjs-webpack-plugin

```js
let OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
let UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
    ...
    optimization:  { // 优化项
        minimizer: [
            new UglifyJsPlugin({ // js 代码压缩
                cache: true, // 缓存
                parallel: true, // 并发打包
                sourceMap: true, // 调试使用 源码映射
            }),
            new OptimizeCssAssetsWebpackPlugin(), // css 代码压缩
        ]
    },
    devServer: { // 开发服务器配置
        port: 4000,
        progress: true, // 打包进度条
        contentBase: './dist', // 以contentBase目录运行静态服务
        open: true, // 自动打开web页面
        compress: true, // 压缩
    },
}
```

## uglifyjs-webpack-plugin js代码压缩

> js代码压缩

```js
// 示例同 optimize-css-assets-webpack-plugin
```



## webpack.ProvidePlugin

> 引入webpack模块
>
> new webpack.ProvidePlugin({})
>
> // 在每个模块中都注入 $

```js
let webpack = require('webpack')
...
    plugins: [ // 放着所有插件
		...
        new webpack.ProvidePlugin({ // 在每个模块中都注入 $
            $: 'jquery'
        })
    ],
```

## clean-webpack-plugin 打包前清空 dist 文件夹

> 打包前清空 dist 文件夹

```
yarn add clean-webpack-plugin -D
```

```js
let { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
    ...
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'index.html',
        }),
        new CleanWebpackPlugin()
    ],
}

```

## copy-webpack-plugin 把文件夹（静态文件）拷贝到 打包文件夹

> 把文件夹（静态文件）拷贝到 打包文件夹

```
yarn add copy-webpack-plugin -D
```

```js
let CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    ...
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'index.html',
        }),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {from: './public', to: './public'}
            ]
        })
    ],
}
```











## webpack.BannerPlugin

> 内置plugin，无需安装
>
> 工作中每个人写的代码都要写上备注，为的就是在发生问题时可以找到当时写代码的人。有时候也用于版权声明。

```js
let webpack = require('webpack')


module.exports = {
    ...
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'index.html',
        }),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {from: './public', to: './public'}
            ]
        }),
        new webpack.BannerPlugin('V1.1.1')
    ],
}
```

## purgecss-webpack-plugin 去除多余的css

用于生产环境去除多余的css

```js
            new PurgecssPlugin({
                paths: glob.sync([path.join(__dirname, "./**/*.vue")]),
                extractors: [{
                    extractor: class Extractor {
                        static extract(content) {
                            const validSection = content.replace(
                                /<style([\s\S]*?)<\/style>+/gim,
                                ""
                            );
                            return validSection.match(/[A-Za-z0-9-_:/]+/g) || [];
                        }
                    },
                    extensions: ["html", "vue"]
                }],
                whitelist: ["html", "body"],
                whitelistPatterns: [/el-.*/],
                whitelistPatternsChildren: [/^token/, /^pre/, /^code/]
            })
```

```js
const PurgeCSSPlugin = require('purgecss-webpack-plugin')
const glob = require('glob')
...  
plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new PurgeCSSPlugin({
      paths: glob.sync(`${PATHS.src}/**/*`,  { nodir: true }),
    }),
  ]
```









# 5、常用loader

- loader希望功能单一，所以css-loader和style-loader没有整合
- loader用法 字符串--只用一个loader use: 'css-loader'
- 多个loader 使用数组 []
- loader 的顺序 默认从右向左执行
- loader 还可以写成对象方式 use: [{ loader: 'style-loader', options: {可以传参}}]

```js
// webpack.config.js
...
    module: { // 模块 解析非js文件
        rules: [ // 规则 
            {
                test: /\.css$/, // 正则--以.css结尾的
                use: [
                    {
                        loader: 'style-loader'
                    },
                    'css-loader'
                ]
            },
        ]
    },
```

## loader分类



- pre 前面执行loader
- normal 普通loader
- 内联loader，可以直接在代码中使用
- post 后置loader



## css相关loader

> style-loader  把css 插入 head 标签中
>
> ​	说明：使用MiniCssExtractPlugin.loader代替 style-loader， 把抽离的css文件以link标签形式插入
>
> css-loader  解析@impor这种语法  解析路径
>
> less-loader 把less -> css
>
> sass-loader  处理 sass -> css

```js
...
    module: { // 模块 解析非js文件
        rules: [ // 规则 
			...
            {
                test: /\.less$/, // 正则--以.less结尾的
                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            insert: 'head' // 插入head 或者 body
                        }
                    },
                    'css-loader', // @import 解析路径
                    'less-loader', // 把less -> css
                    'sass-loader' // 把sass -> css
                ]
            }
        ]
    },
```

```js
// MiniCssExtractPlugin将css抽离成文件 MiniCssExtractPlugin.loader将抽离的css文件以link方式插入
...
    plugins: [ // 放着所有插件
        ...
		new MiniCssExtractPlugin({
            filename: 'main.css'
        })
    ],
    module: {
        rules: [ // 规则 
            {

                test: /\.css$/, // 正则--以.css结尾的
                use: [
                    MiniCssExtractPlugin.loader, // 把抽离的css文件以link标签形式插入
                    'css-loader'
                ]
            },
            {
                test: /\.less$/, // 正则--以.less结尾的
                use: [
                    MiniCssExtractPlugin.loader, // 把抽离的css文件以link标签形式插入
                    'css-loader', // @import 解析路径
                    'less-loader' // 把less -> css
                ]
            }
        ]
    }
```



### css-loader & style-loader

> css-loader 解析@impor这种语法  解析路径
>
> style-loader 把css 插入 head 标签中

```
 yarn add css-loader style-loader -D
```



```js
...
rules: [ // 规则 
    {
        test: /\.css$/, // 正则--以.css结尾的
        use: [
            {
                loader: 'style-loader'
            },
            'css-loader'
        ]
    },
    {
        test: /\.less$/, // 正则--以.less结尾的
        use: [
            MiniCssExtractPlugin.loader, // 把抽离的css文件以link标签形式插入
            'css-loader', // @import 解析路径
            'less-loader' // 把less -> css
        ]
    }
]
```

less-loader

> 把less -> css
>
> 结合 css-loader & style-loader 使用

```
 yarn add less less-loader -D
```



```js
...
    module: { // 模块 解析非js文件
        rules: [ // 规则 
			...
            {
                test: /\.less$/, // 正则--以.less结尾的
                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            insert: 'head' // 插入head 或者 body
                        }
                    },
                    'css-loader', // @import 解析路径
                    'less-loader' // 把less -> css
                ]
            }
        ]
    },
```

### sass-loader

> 处理 sass -> css
>
> 结合css-loader 和 style-loader 使用

```
yarn add node-sass sass-loader -D
```



## postcss-loader

> 自动添加浏览器前缀 -webkit-
>
> 结合 autoprefixer 一起使用
>
> 需要创建 postcss.config.js

```
yarn add postcss-loader autoprefixer -D
```

```js
// 创建 postcss.config.js
module.exports = {
    plugins: [require('autoprefixer')]
}
```

```js
// webpack.config.js 中在 css-loader下方后者后方添加 postcss-loader
    module: { // 模块 解析非js文件
        rules: [ // 规则 
            {

                test: /\.css$/, // 正则--以.css结尾的
                use: [
                    MiniCssExtractPlugin.loader, // 把抽离的css文件以link标签形式插入
                    'css-loader',
                    'postcss-loader'
                ]
            },
            {
                test: /\.less$/, // 正则--以.less结尾的
                use: [
                    MiniCssExtractPlugin.loader, // 把抽离的css文件以link标签形式插入
                    'css-loader', // @import 解析路径
                    'less-loader', // 把less -> css
                    'postcss-loader', // 自动添加浏览器前缀
                ]
            }
        ]
    },
```











```json
// 如果不生效，在package.json文件中配置兼容性
...
 "browserslist": [
      "defaults",
      "not ie < 8",
      "last 2 versions",
      "> 1%",
      "iOS 7",
      "last 3 iOS versions"
    ],
```



## babel-loader

> es6 转 es5

```
yarn add babel-loader @babel/core @babel/preset-env -D
yarn add @babel/plugin-transform-runtime -D
yarn add @babel/runtime -D
yarn add core-js -D
```

```js
...
    module: { // 模块 解析非js文件
        rules: [ // 规则 
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: { // 用 babel-loader 需要把es6 转 es5
                        presets: [ // 插件集合
                            ['@babel/preset-env', {
                                'useBuiltIns': 'usage',
                                'targets': {
                                    'chrome': '58',
                                    'ie': '9'
                                },
                                'corejs': '3'
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-transform-runtime'
                        ]
                    }
                },
                include: path.resolve(__dirname, 'src'), // 包括 src
                exclude: /node_modules/, // 排除 node_modules
            },            
			...
        ]
    },
            
            
            
// 如不生效，引入
// import 'core-js/stable'
// import "regenerator-runtime/runtime"
```

## file-loader(配合url-loader)

> 处理图片
>
> 默认会在内部生成一张图片 到dist目录下
>
> 把生成的图片的名字返回回来
>
> 安装url-loader后不需要单独配置

```js
yarn add file-loader -D
```

## url-loader

> 做一个限制，小于多少k( a * 1024  )时 用base64转化
>
> 超出用file-loader产出

```
yarn add url-loader -D
```

```js
...
{
    test: /\.(png|jpg|gif)$/,
    use: {
        loader: 'url-loader',
        options: {
            esModule: false,
            limit: 1, // 200*1024 -> 200k
            outputPath: '/img/', // 图片输出路径
            publicPath: 'http://baidu.com' // 公共路径 引用 图片 资源时候统一给加上 如 cdn
        }
    }
},
```







## html-withimg-loader

> 处理html文件中的img图片url







## eslint-loader

> 校验
>
> 在 eslint.org ->  Demo
>
> click "Rules Configuration"
>
> 选择配置
>
> 点击最下方 "Download .eslintrc.json file with this configuration" 下载配置文件
>
> 检查文件名称 “  .eslintrc.json  ” 放入根目录

```
yarn add eslint eslint-loader -D
```

```js
...
{
    test: /\.js$/,
        use: {
            loader: 'eslint-loader',
                options: {
                    enforce: 'pre', // previous->强制在babel-loader之前执行,post->在普通loader之后执行  loader从右向左执行，从下向上执行
                }
                },
                    include: [path.resolve(__dirname, 'src')],
                        // exclude: [/node_modules/]

        },
            {
                test: /\.js$/,
                    use: {
                        loader: 'babel-loader', // 默认普通loader normal
                            options: { // 用 babel-loader 需要把es6 转 es5
                                presets: [ // 插件集合
                                    ['@babel/preset-env', {
                                        'useBuiltIns': 'usage',
                                        'targets': {
                                            'chrome': '58',
                                            'ie': '9'
                                        },
                                        'corejs': '3'
                                    }]
                                ],
                                    plugins: [
                                        '@babel/plugin-proposal-class-properties',
                                        '@babel/plugin-transform-runtime'
                                    ]
                            }
                    },
                        include: path.resolve(__dirname, 'src'), // 包括 src
                            exclude: /node_modules/, // 排除 node_modules
            },   
```



# 6、externals(外部引入 cdn ，不需要打包)

> 外部引入 cdn ，不需要打包

```js
mode: 'production', // 模式 默认两种 production development 
entry: './src/index.js', // 入口
externals: { // 外部引入 cdn ，不需要打包
   jquery: 'jQuery'
},
```









# 7、多页面应用

```js
let path = require('path')
let HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    // 多入口
    mode: 'development',
    entry: {
        home: './src/index.js',
        other: './src/other.js'
    },
    output: {
        // [name] home,other
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'home.html',
            chunks: ['home'], // 代码块
        }),
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'other.html',
            chunks: ['other'], // 代码块
        })
    ]
}
```

# 8、devtool：souce-map



- source-map
  - 大和全 会单独生成一个sourcemap 文件 出错了会标识 当前报错的列
- eval-source-map
  - 不会产生单独的文件 但会可以显示行和列
- cheap-module-source-map
  - 会产生文件，不会产生列，不能直接调试 但是是一个单独的映射文件
- eval-cheap-module-source-map
  - 不会产生文件 集成在打包后的文件中 不会产生列

```js
module.export = {
	entry: path.resolve(__dirname, 'src'),
    devtool: 'eval-cheap-module-source-map'
    ...
}
```

# 9、resolve

```js
module.exports = {
    ...
    resolve : { 
        modules: [path.resolve('node_modules')，path.resolve('dist')], // 仅在当前目录下查找
    	wxtensions: ['.js','.css','.json'], // 没有写后缀名，按照此顺序进行匹配
    	// mainFields: ['style','main'], // 主入口字段 先找style 后找main
        // mainFiles: [], // 主入口文件名字
	}
}
```

# 10、环境变量

> development 和 production
>
> 修改 webpack.config.js => webpack.base.js
>
> 创建 webpack.dev.js 和 webpack.prod.js
>
> 安装 webpack-merge
>
> 修改package.json 中打包项

```
yarn add webpack-merge -D
```

```js\
// webpack.prod.js
let { merge } = require('webpack-merge')
let base = require('./webpack.base')
let webpack = require('webpack')

module.exports = merge(base, {
    mode: 'production', // development production
    plugins: [
        new webpack.DefinePlugin({
            DEV: JSON.stringify('production'), // 'dev' 'production'
            FLAG: true,
            EXPRESSION: '1+1'
        })
    ],
})
```

```js
// webpack.dev.js
let { merge } = require('webpack-merge')
let base = require('./webpack.base')
let webpack = require('webpack')

module.exports = merge(base, {
    mode: 'development', // development production
    plugins: [
        new webpack.DefinePlugin({
            DEV: JSON.stringify('development'), // 'dev' 'production'
            FLAG: true,
            EXPRESSION: '1+1'
        })
    ],
})
```

```json
...
"scripts": {
    "dev": "webpack-dev-server --open --config webpack.dev.js",
    "build:dev": "webpack --config webpack.dev.js",
    "build:prod": "webpack --config webpack.prod.js"
},
```

# 11、glob-all

```
npm i glob-all -D
```

```js
var glob = require('glob-all');
var files = glob.sync([
  'files/**',      //include all     files/
  '!files/x/**',   //then, exclude   files/x/
  'files/x/z.txt'  //then, reinclude files/x/z.txt
]);
```

# 12、merge

合并webpack配置文件使用

```js
yarn add webpack-merge -D
```

```js
// webpack.base.js

```

```js
// webpack.dev.js
const {merge} = require('webpack-merge');
const baseWebpack =  require("../webpack.base");
module.exports = merge(baseWebpack,{
    entry: './src/sphereEffect.js'
})
```

```json
"scripts": {
    "dev:sphereEffect": "webpack-dev-server --config webpack_config/webpack.dev.js",
    "build": "webpack"
 },
```









# 13、示例

## 示例1

```js
/*
 * @Author: Lst
 * @Date: 2020-12-29 11:49:40
 * @LastEditors: Lst
 * @LastEditTime: 2020-12-30 16:50:28
 * @Description: /
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'production', // production  development
    entry: {
        index: './js/index.js'
    },
    devtool: 'inline-source-map', // 将编译后的代码映射回原始源代码
    devServer: { // 安装webpack-dev-server 开发环境运行 代码 
        contentBase: './dist', // 入口
        port: 9000, // 端口
    },
    plugins: [
        new CleanWebpackPlugin(), // 安装 clean-webpack-plugin 清空dist文件夹
        new HtmlWebpackPlugin({ // 安装 html-webpack-plugin 生成html文件
            template: './index.html', // 以 ./index.html 为 模板，创建html文件
            favicon: './img/favicon.ico'
        })
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        // filename: 'bundle.js'
        filename: '[name].[contenthash].js', // contenthash 将根据资源内容创建出唯一 hash 避免缓存问题
    },
    optimization: {
        moduleIds: 'deterministic', // 对于没有涉及到改变的文件，前后两次构建，vendor hash 保持一致 利用浏览器缓存 仅更新hash变化的文件
        runtimeChunk: true, // 将 runtime 代码拆分为一个单独的 chunk  异步加载路由即为runtime代码
        splitChunks: {
            cacheGroups: {
                vendor: { // 将第三方库(library)（例如 lodash 或 react）提取到单独的 vendor chunk 文件中
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/i, // css
                use: ['style-loader','css-loader'] // 安装 style-loader css-loader
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i, // picture
                // type: 'asset/resource'
                use: [{
                    loader: 'file-loader',
                    options: {
                        outputPath: './img',
                        publicPath: './img'
                    }
                }]
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i, // font字体
                type: 'asset/resource'
            },
            {
                test: /\.(csv|tsv)$/i, // 加载 csv tsv文件   json文件内置
                use: ['csv-loader'] // 安装csv-loader
            },
            {
                test: /\.xml$/i, // 加载xml文件
                use: ['xml-loader'] // 安装xml-loader
            },
            {
                test: /(\.jsx|\.js)$/,
                use: {
                    loader: "babel-loader", // es6转es5
                    options:{
                        presets: ["@babel/preset-env"],   // 也可以把 {presets: ["@babel/preset-env"] } 存入.babelrc文件内
                        plugins: ["@babel/plugin-transform-runtime"] // 解决async  await 报错 babel/plugin-transform-runtime
                    }
                },
                exclude: /node_modules/, // 忽略 node_modules
            }
        ]
    }
}
```



## 示例2

```js
// webpack.base.js
const path = require('path')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    mode: 'development',
    // entry: './src/index.js',
    output: {
        filename: 'js/bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'eval-source-map',
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebPackPlugin({
            template: path.join(__dirname, './index.html'),
            filename: 'index.html',
            minify: false, 
        }),
        new MiniCssExtractPlugin({
            filename: 'css/main.css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {from: './public', to: './public'}
            ]
        })
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(png|jpg|gig)$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        esModule: false,
                        limit: 1*1024,
                        outputPath: '/img/',
                        
                    }
                }
            }
        ]
    },
    devServer: {
        port: 4000,
        progress: true,
        contentBase: './dist',
        open: true,
        compress: true
    }
}
```

```js
// webpack_solar_system.js
// 地球细胞核空间特效
let { merge } = require('webpack-merge')
let base = require('../webpack.base')

module.exports = merge(base,{
    entry: './src/solar_system.js'
})
```

```json
"dev:solar_system": "webpack-dev-server --config webpack_config/webpack_solar_system.js",
```



## 示例3 通用

```js
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
module.exports = {
    mode: 'development',
    output: {
        filename: 'js/bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'eval-source-map',
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebPackPlugin({
            template: path.join(__dirname,'./index.html'),
            filename: 'index.html',
            minify: false
        }),
        new CopyWebpackPlugin({
            patterns: [
                {from: './public', to: './public'}
            ]
        }),
        new MiniCssExtractPlugin({
            filename: 'css/main.css'
        })
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(png|jpg|gig)$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        esModule: false,
                        limit: 1*1024,
                        outputPath: '/img/',
                        
                    }
                }
            },
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: { // 用 babel-loader 需要把es6 转 es5
                        presets: [ // 插件集合
                            ['@babel/preset-env', {
                                'useBuiltIns': 'usage',
                                'targets': {
                                    'chrome': '58',
                                    'ie': '9'
                                },
                                'corejs': '3'
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-transform-runtime'
                        ]
                    }
                },
                include: path.resolve(__dirname, 'src'), // 包括 src
                exclude: /node_modules/, // 排除 node_modules
            }, 
        ]
    },
    devServer: {
        port: 4000,
        progress: true,
        contentBase: './dist',
        open: true,
        compress: true
    }
}
```



