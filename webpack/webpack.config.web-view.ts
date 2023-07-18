import webpack from "webpack";
import merge from "webpack-merge";
import configBase, { rootDir } from "./webpack.config.base";
import { getWebViewEntries } from "./webpack.util";

/** webpack configuration for building webViews */
const configWebView: webpack.Configuration = merge(configBase, {
  // configuration name so we can depend on it in main
  name: "webView",
  // instructions to build each extension webview source file
  entry: getWebViewEntries,
  output: {
    // Build all the web views in the folders where they are with the temp dir appended
    path: rootDir,
  },
});

export default configWebView;
