var webpack = require('webpack'),
  path = require('path'),
  yargs = require('yargs');

var libraryName = 'immuts',
  plugins = [],
  outputFile;

var c = {
  DEBUG: true
};

if (yargs.argv.p) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }));
  outputFile = libraryName + '.min.js';
  c.DEBUG = false;
} else {
  outputFile = libraryName + '.js';
}

var q = require("querystring").encode({ json: JSON.stringify(c) });

var config = {
  entry: [
    __dirname + '/src/main.ts'
  ],
  output: {
    filename: "./dist/" + outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loaders: ['ts', `ifdef-loader?${q}`], exclude: /node_modules/ }
    ]
  },
  resolve: {
    root: path.resolve('./src'),
    extensions: ['', '.js', '.ts', '.jsx', '.tsx']
  },
  plugins: plugins
};

module.exports = config;