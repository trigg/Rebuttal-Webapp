import path from 'path';
import webpack from 'webpack';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// in case you run into any typescript error when configuring `devServer`
import 'webpack-dev-server';

const config: webpack.Configuration = {
  mode: 'production',
  entry: './src/js/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist','js'),
    filename: 'main.js',
  },
  module: {
    rules: [
        {
            test: /\.ts?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }
    ]
  }
};

export default config;