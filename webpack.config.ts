import webpack, { Resolver } from "webpack";
import path from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import { merge } from "webpack-merge";
import { glob } from "glob";

// Note: Using a .ts file as the webpack config requires not having "type": "module" in package.json
// https://stackoverflow.com/a/76005614

const isDev = process.env.NODE_ENV !== "production";

// Note: we do not want to do any chunking because neither webViews nor main can import dependencies
// other than those listed in configBase.externals. Each webView must contain all its dependency
// code, and main must contain all its dependency code.
/** webpack configuration shared by webView building and main building */
const configBase: webpack.Configuration = {
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
 * String of what a web view needs to have in its name before the file extension to be considered a
 * web-view
 *
 * Web Views should be named <name>.web-view.<extension>
 */
const webViewTag = ".web-view";
/**
 * Glob filename matcher for React web views.
 * React Web Views should be named <name>.web-view.tsx
 */
const webViewTsxGlob = "**/*.web-view.tsx";
/**
 * Regex file name matcher for React web views.
 * React Web Views should be named <name>.web-view.tsx
 *
 * Note: this regex allows the extension to be optional.
 */
const webViewTsxRegex = /.+\.web-view(\.[tj]sx)?$/;
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
 * @param join function to use to join the paths together
 * @returns WebView path with temporary WebView directory inserted into the module path
 */
function getWebViewTempPath(
  webViewPath: string,
  join: (path: string, request: string) => string = path.join
) {
  const webViewInfo = path.parse(webViewPath);

  // If the web view doesn't have a file extension, parsing makes it think the extension is
  // '.web-view', so we need to add it back
  const webViewName = webViewInfo.ext === webViewTag ? webViewInfo.base : webViewInfo.name;
  // Put transpiled WebViews in a temp folder in the same directory as the original WebView
  // Make sure to preserve the ./ to indicate it is a relative path
  return `${webViewInfo.dir === "." ? "./" : ""}${join(
    webViewInfo.dir,
    join(webViewTempDir, `${webViewName}.js`)
  )}`;
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

// Webpack resolve plugins are enhanced-resolve plugins, which use tapable under the hood.
// Unfortunately, most of this api is very scantly documented, so I pretty much went off of examples
// and trial-and-error. I added lots of documentation here so there is at least some documentation.
// enhanced-resolve https://github.com/webpack/enhanced-resolve
// tapable https://github.com/webpack/tapable
// enhanced-resolve plugin examples https://github.com/webpack/enhanced-resolve/blob/main/lib/ExtensionAliasPlugin.js
// DirectoryNamedWebpackPlugin https://github.com/shaketbaby/directory-named-webpack-plugin/blob/master/index.js
/** Webpack resolution plugin that redirects WebView imports to their compiled version */
class WebViewResolvePlugin {
  // I didn't find much on what the hooks are called, but maybe at least some of them are the keys
  // of KnownHooks: https://github.com/webpack/enhanced-resolve/blob/a998c7d218b7a9ec2461fc4fddd1ad5dd7687485/types.d.ts#L240
  // Also https://github.com/webpack/webpack/issues/6817#issuecomment-542448438 shows how to add
  // path alias functionality with this plugin syntax.
  // However, it seems the mystery of available hooks is not solved as DirectoryNamedWebpackPlugin
  // uses hook names that are not in KnownHooks.
  /** Tap into the enhanced-resolve "resolve" hook with our resolve logic. */
  readonly source = "resolve";
  /** Feed into the enhanced-resolve "resolve" hook from our resolve logic */
  readonly target = "resolve";

  /**
   * Function that applies this plugin to webpack resolving. Use the resolver to "tap into" webpack
   * resolving with our own logic
   * @param resolver
   */
  apply(resolver: Resolver) {
    // Get the resolve hook for performing a new resolve for some reason.
    // Just following what is in examples - not sure why do this instead of using the same hook
    // in both places and why use `ensureHook` here and `getHook` below.
    const target = resolver.ensureHook(this.target);
    resolver
      // Get the resolve hook
      .getHook(this.source)
      // Add our plugin to the list of resolvers to run
      .tapAsync(
        // Internally note that this is our plugin
        "TempWebpackResolvePlugin",
        /**
         * The logic to add to webpack resolving so it will look in the temp dir for built code.
         *
         * @param request information about the resolve request
         * @param resolveContext information about the process the hook has taken to get here
         * @param callback function to run to continue the resolution process
         *   - call with no parameters to continue resolving like this plugin did nothing
         *   - call with first parameter null and second parameter a fully resolved
         *   `{ path, relativePath }` (including file extension) to conclude resolving at that file
         *   - call with first parameter `string` or `Error` or something (not sure) to indicate
         *   error
         *   - Note: another option is to call `resolver.doResolve` to start the resolution process
         *   over with a new `path` and `relativePath` that do not need to be fully resolved. Just
         *   make sure that second call can't come into your hook again and cause another
         *   `resolver.doResolve`, or you will have an infinite loop. We pass this `callback` param
         *   into `resolver.doResolve`, and it calls it automatically
         * @returns Seems it doesn't matter if or what you return. Just return to quit early
         */
        (request, resolveContext, callback) => {
          // If the request is somehow not defined (not sure how - just part of the type definition)
          // or already has the temp dir in the path (meaning we have already modified the path),
          // continue resolving without this plugin so we do not edit the request a second time
          if (
            // If somehow it isn't a request, do not edit it. Not sure when this would happen
            !request.request ||
            request.request.includes(`/${webViewTempDir}/`)
          )
            // Continue resolving without changing anything with this plugin
            return callback();

          // Get the <file>?stuff aka the resource query on the request path (includes the ?)
          let resourceQuery = request.query;
          let requestPath = request.request;
          // request.query sometimes doesn't have the ?stuff in it for some reason, so get it
          // manually from the request path if it isn't already in request.query
          if (!request.query) {
            const queryInd = requestPath.lastIndexOf("?");
            // If there is a ? and something after it in the request path, use that as the resource
            // query
            if (queryInd >= 0 && queryInd < requestPath.length - 1) {
              resourceQuery = requestPath.substring(queryInd);
              requestPath = requestPath.substring(0, queryInd);
            }
          }

          // If it isn't calling for a webView, continue resolving without changing anything here
          if (!webViewTsxRegex.test(requestPath)) return callback();

          // Get the path to the relevant file in the temp dir
          // Note: this path must keep the ./ at the start, or webpack won't resolve it correctly
          let tempViewPath = getWebViewTempPath(requestPath, resolver.join);
          // Add the query back onto the request path if it was originally there
          if (!request.query) tempViewPath += resourceQuery;

          // Resolve this file but in the temp dir
          resolver.doResolve(
            target,
            {
              ...request,
              request: tempViewPath,
            },
            `Added temp dir to resolve request path: ${tempViewPath}`,
            resolveContext,
            callback
          );
        }
      );
  }
}

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
  resolve: {
    plugins: [
      // Get web view files from the temp dir where they are built
      new WebViewResolvePlugin(),
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
      ],
    }),
  ],
});

const config: webpack.Configuration[] = [configWebView, configMain];

export default config;
