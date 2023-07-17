import webpack from "webpack";
import path from "path";
import merge from "webpack-merge";
import CopyPlugin from "copy-webpack-plugin";
import configBase, { rootDir } from "./webpack.config.base";
import WebViewResolveWebpackPlugin from "./web-view-resolve-webpack-plugin";

/** webpack configuration for building main */
const configMain: webpack.Configuration = merge(configBase, {
  context: rootDir,
  // configuration name
  name: "main",
  // extension main source file to build
  entry: "./lib/main.ts",
  // wait until webView bundling finishes - webpack.config.web-view.ts
  dependencies: ["webView"],
  output: {
    // extension output directory
    path: path.resolve(rootDir, "build"),
    filename: "paranext-extension-template.js",
    // Exporting the library https://webpack.js.org/guides/author-libraries/#expose-the-library
    globalObject: "globalThis",
    library: {
      name: "paranextExtensionTemplate",
      type: "umd",
    },
    // Empty the output folder before building
    clean: true,
  },
  resolve: {
    plugins: [
      // Get web view files from the temp dir where they are built
      new WebViewResolveWebpackPlugin(),
    ],
  },
  plugins: [
    // Copy static files to the output folder https://webpack.js.org/plugins/copy-webpack-plugin/
    new CopyPlugin({
      patterns: [
        // We want all files from the public folder copied into the output folder
        { from: "public", to: "./" },
        // Copy this extension's type declaration file into the output folder
        { from: "lib/types/paranext-extension-template.d.ts", to: "./" },
        // We need to distribute the package.json for Paranext to read the extension properly
        { from: "package.json", to: "./" },
      ],
    }),
  ],
});

export default configMain;
