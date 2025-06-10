import path from "path";
import webpack from "webpack";

import { fileURLToPath } from "url";
import CopyPlugin from "copy-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  resolve: {
    extensions: [".ts", ".js"],
  },
  mode: "development",
  entry: "./src/js/main.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/main.js",
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        use: "raw-loader",
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/img", to: "img" },
        { from: "src/snd", to: "snd" },
        { from: "*.html", to: "", context: "src/" },
      ],
    }),
  ],
};

export default config;
