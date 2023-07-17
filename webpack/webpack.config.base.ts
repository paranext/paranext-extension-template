import path from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import webpack from "webpack";

/** The base directory from which webpack should operate (should be the root repo folder) */
export const rootDir = path.resolve(__dirname, "..");

const isDev = process.env.NODE_ENV !== "production";

// Note: we do not want to do any chunking because neither webViews nor main can import dependencies
// other than those listed in configBase.externals. Each webView must contain all its dependency
// code, and main must contain all its dependency code.
/** webpack configuration shared by webView building and main building */
const configBase: webpack.Configuration = {
  // The operating directory for webpack instead of current working directory
  context: rootDir,
  mode: isDev ? "development" : "production",
  // Bundle the sourcemap into the file since webviews are injected as strings into the main file
  devtool: isDev ? "inline-source-map" : false,
  watchOptions: {
    ignored: ["**/node_modules"],
  },
  // Use require for externals https://webpack.js.org/configuration/externals/#externalstypecommonjs
  externalsType: "commonjs",
  // Modules that Paranext supplies to extensions https://webpack.js.org/configuration/externals/
  // All other dependencies must be bundled into the extension
  externals: [
    "react",
    "react/jsx-runtime",
    "react-dom",
    "react-dom/client",
    "papi-frontend",
    "papi-backend",
    "@sillsdev/scripture",
  ],
  module: {
    rules: [
      /**
       * Import fully loaded and transformed files as strings with "./file?inline"
       *
       * WARNING: These files are NOT bundled. The rules are applied, but webpack does not bundle
       * dependencies into these files before providing them, unfortunately.
       */
      // This must be the first rule in order to be applied after all other transformations
      // https://webpack.js.org/guides/asset-modules/#replacing-inline-loader-syntax
      {
        resourceQuery: /inline/,
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
      // https://webpack.js.org/loaders/sass-loader/#getting-started
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
      /**
       * Load images as data uris
       *
       * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
       * not currently supported in Platform.Bible
       */
      // https://webpack.js.org/guides/asset-management/#loading-images
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/inline",
      },
      /**
       * Load fonts as data uris
       *
       * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
       * not currently supported in Platform.Bible
       */
      // https://webpack.js.org/guides/asset-management/#loading-fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/inline",
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

export default configBase;
