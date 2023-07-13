import webpack from "webpack";
import path from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import { merge } from "webpack-merge";

// Using a .ts file as the webpack config requires not having "type": "module" in package.json
// https://stackoverflow.com/a/76005614

const devMode = process.env.NODE_ENV !== "production";

const configBase: webpack.Configuration = {
  // Bundle the sourcemap into the file since webviews are injected as strings into the main file
  devtool: "inline-source-map",
  // Use require for externals https://webpack.js.org/configuration/externals/#externalstypecommonjs
  externalsType: "commonjs",
  // Modules that Paranext supplies to extensions https://webpack.js.org/configuration/externals/
  externals: [
    "react",
    "react/jsx-runtime",
    "react-dom",
    "react-dom/client",
    "papi-frontend",
    "papi-backend",
  ],
  module: {
    rules: [
      /**
       * Import fully transformed files as strings with "./file?transformed"
       *
       * WARNING: These files are NOT bundled. The rules are applied, but webpack does not bundle
       * these files before providing them, unfortunately.
       */
      // This must be the first rule in order to be applied after all other transformations
      // https://webpack.js.org/guides/asset-modules/#replacing-inline-loader-syntax
      {
        resourceQuery: /transformed/,
        type: "asset/source",
      },
      // Load TypeScript https://webpack.js.org/guides/typescript/#basic-setup
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            // Do not fail to build on type errors
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
      /**
       * Import scss, sass, and css files as strings
       */
      //https://webpack.js.org/loaders/sass-loader/#getting-started
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          // We are not using style-loader since we are passing styles to papi, not inserting them
          // into dom
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
      // Load images https://webpack.js.org/guides/asset-management/#loading-images
      // TODO: Investigate how these files are bundled. Does this actually work?
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      // Consider using @svgr/webpack? https://www.npmjs.com/package/@svgr/webpack
      // Load fonts https://webpack.js.org/guides/asset-management/#loading-fonts
      // TODO: Investigate how these files are bundled. Does this actually work?
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
      /**
       * Import files with no transformation as strings with "./file?raw"
       */
      // This must be the last rule in order to be applied before all other transformations
      // https://webpack.js.org/guides/asset-modules/#replacing-inline-loader-syntax
      {
        resourceQuery: /raw/,
        type: "asset/source",
      },
    ],
  },
  resolve: {
    // If no file extension is provided on file path imports, use these extensions left-to-right
    // https://webpack.js.org/guides/typescript/#basic-setup
    extensions: [".tsx", ".ts", ".js"],
    plugins: [
      // use tsconfig.json paths https://www.npmjs.com/package/tsconfig-paths-webpack-plugin
      new TsconfigPathsPlugin(),
    ],
  },
};

const configWebView: webpack.Configuration = {
  // configuration name so we can depend on it in main
  name: "webView",
  // extension webview source file
  entry: {
    1: {
      import: "./lib/extension-template.web-view.tsx",
      filename: "./lib/temp-webpack/extension-template.web-view.js",
    },
    2: {
      import: "./lib/extension-template-2.web-view.tsx",
      filename: "./lib/temp-webpack/extension-template-2.web-view.js",
    },
  },
  output: {
    path: __dirname,
  },
};

const configMain: webpack.Configuration = {
  // configuration name
  name: "main",
  // extension main source file
  entry: "./lib/main.ts",
  // wait until webView bundling finishes
  dependencies: ["webView"],
  output: {
    // extension output directory
    path: path.resolve(__dirname, "dist"),
    filename: "paranext-extension-template.js",
    // Exporting the library https://webpack.js.org/guides/author-libraries/#expose-the-library
    globalObject: "globalThis",
    library: {
      name: "paranextExtensionTemplate",
      type: "umd",
    },
    // Empty the dist folder before building
    clean: true,
  },
  plugins: [
    // Copy static files to the output folder https://webpack.js.org/plugins/copy-webpack-plugin/
    new CopyPlugin({
      // We want all files from the public folder copied into the output folder
      patterns: [{ from: "public", to: "./" }],
    }),
  ],
};

const config: webpack.Configuration[] = [
  merge(configBase, configWebView),
  merge(configBase, configMain),
];

export default config;
