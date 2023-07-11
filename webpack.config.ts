import webpack from "webpack";
import path from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

// Using a .ts file as the webpack config requires not having "type": "module" in package.json
// https://stackoverflow.com/a/76005614

const devMode = process.env.NODE_ENV !== "production";

const config: webpack.Configuration = {
  // extension main source file
  entry: "./lib/main.ts",
  // Bundle the sourcemap into the file since webviews are injected as strings into the main file
  devtool: "inline-source-map",
  // Use require for externals https://webpack.js.org/configuration/externals/#externalstypecommonjs
  externalsType: "commonjs",
  // Modules that Paranext supplies to extensions https://webpack.js.org/configuration/externals/
  externals: ["react", "react-dom", "papi-frontend", "papi-backend"],
  output: {
    // extension main output file
    filename: "paranext-extension-template.js",
    // extension output directory
    path: path.resolve(__dirname, "dist"),
    // Exporting the library https://webpack.js.org/guides/author-libraries/#expose-the-library
    globalObject: "globalThis",
    library: {
      name: "paranextExtensionTemplate",
      type: "umd",
    },
    // Empty the dist folder before building
    clean: true,
  },
  module: {
    rules: [
      // Import fully transformed files as strings with "file?bundled" (this must be the first rule
      // in order to be applied after all other transformations)
      // https://webpack.js.org/guides/asset-modules/#replacing-inline-loader-syntax
      {
        resourceQuery: /bundled/,
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
      // Load scss and css https://webpack.js.org/loaders/sass-loader/#getting-started
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
  plugins: [
    // Copy static files to the output folder https://webpack.js.org/plugins/copy-webpack-plugin/
    new CopyPlugin({
      // We want all files from the public folder copied into the output folder
      patterns: [{ from: "public", to: "./" }],
    }),
  ],
};

export default config;
