import webpack from "webpack";
import path from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import { merge } from "webpack-merge";
import { glob } from "glob";

// Note: Using a .ts file as the webpack config requires not having "type": "module" in package.json
// https://stackoverflow.com/a/76005614

const devMode = process.env.NODE_ENV !== "production";

// Note: we do not want to do any chunking because neither webViews nor main can import dependencies
// other than those listed in configBase.externals. Each webView must contain all its dependency
// code, and main must contain all its dependency code.
/** webpack configuration shared by webView building and main building */
const configBase: webpack.Configuration = {
  // Bundle the sourcemap into the file since webviews are injected as strings into the main file
  devtool: devMode ? "inline-source-map" : false,
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

/**
 * Glob filename matcher for React web views.
 * React Web Views should be named <name>.web-view.tsx
 */
const webViewTsxGlob = "**/*.web-view.tsx";
/** Name of adjacent folder used to store bundled WebView files */
export const webViewTempDir = "temp-webpack";

/**
 * Get a list of TypeScript WebView files to bundle.
 * Path relative to project root
 */
function getWebViewTsxPaths() {
  return glob(webViewTsxGlob, { ignore: "node_modules/**" });
}

/**
 * Gets the bundled WebView path for a WebView file path
 * @param webViewPath relative path to webView e.g. './lib/extension-template.web-view.tsx'
 * @returns WebView path with temporary WebView directory inserted into the module path
 */
function getWebViewTempPath(webViewPath: string) {
  const webViewInfo = path.parse(webViewPath);
  // Put transpiled WebViews in a temp folder in the same directory as the original WebView
  return path.join(webViewInfo.dir, webViewTempDir, `${webViewInfo.name}.js`);
}

/**
 * Get webpack entry configuration to build each web-view source file and put it in a temp-webpack
 * folder in the same directory
 * @returns promise that resolves to the webView entry config
 */
async function getWebViewEntries(): Promise<webpack.EntryObject> {
  console.log("getting webview entries!");
  const tsxWebViews = await getWebViewTsxPaths();
  return Object.fromEntries(
    tsxWebViews.map((webViewPath) => [
      webViewPath,
      {
        import: webViewPath,
        filename: getWebViewTempPath(webViewPath),
      },
    ])
  );
}

/** webpack configuration for building webViews */
const configWebView: webpack.Configuration = merge(configBase, {
  // configuration name so we can depend on it in main
  name: "webView",
  // instructions to build each extension webview source file
  entry: getWebViewEntries,
  output: {
    path: __dirname,
  },
});

/** webpack configuration for building main */
const configMain: webpack.Configuration = merge(configBase, {
  // configuration name
  name: "main",
  // extension main source file to build
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
      patterns: [
        // We want all files from the public folder copied into the output folder
        { from: "public", to: "./" },
        // Copy this extension's type declaration file into the output folder
        { from: "lib/types/paranext-extension-template.d.ts", to: "./" },
      ],
    }),
  ],
});

const config: webpack.Configuration[] = [configWebView, configMain];

export default config;
