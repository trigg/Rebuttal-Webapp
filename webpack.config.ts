import path from 'path';
import webpack from 'webpack';

import { fileURLToPath } from 'url';
import CopyPlugin from "copy-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// in case you run into any typescript error when configuring `devServer`
import 'webpack-dev-server';

const config: webpack.Configuration = {
  mode: 'production',
  entry: './src/js/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/main.js',
  },
  module: {
    rules: [
        {
            test: /\.ts?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }
    ]
  },
  plugins: [
    new CopyPlugin(
    { patterns: [
      { from: "src/img", to: "img"},
      { from: "src/snd", to: "snd"},
      { from: "*.html", to: "", context:"src/"},      
    ]}
    )
  ]

};

export default config;