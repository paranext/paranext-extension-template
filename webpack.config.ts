import configWebView from "./webpack/webpack.config.web-view";
import configMain from "./webpack/webpack.config.main";
import { Configuration } from "@rspack/cli";

// Note: Using a .ts file as the webpack config requires not having "type": "module" in package.json
// https://stackoverflow.com/a/76005614

// We want to build web views and then build main
const config: Promise<Configuration[]> = Promise.all([configWebView(), Promise.resolve(configMain)]);

export default config;
