import path from "path";
import { ModuleFormat } from "rollup";
import { glob } from "glob";

// #region shared with https://github.com/paranext/paranext-core/blob/main/vite/vite.util.ts

/**
 * Glob filename matcher for web views.
 * React Web Views should be named <name>.web-view.tsx
 * HTML Web Views should be named <name>.web-view.ejs
 *  - Note: the HTML web views are .ejs files because rollup was not recognizing them to have exports for some reason.
 */
export const webViewGlob = "**/*.web-view.{tsx,ejs}";
export const webViewTsxGlob = "**/*.web-view.tsx";

/**
 * Regex matcher for TypeScript WebView imports
 */
export const webViewTsxImportRegex = /^.+\.web-view(\.tsx)?$/;

/** Name of adjacent folder used to store WebView files transpiled in the first build step */
export const webViewTempDir = "temp-vite";
export const webViewTempGlob = `**/${webViewTempDir}/*.web-view.js`;

/** Modules that Paranext supplies so extensions can use them easily */
export const paranextProvidedModules = ["react", "react-dom/client", "papi"];

/**
 * Gets a file extension based on the moduleFormat input.
 * Vite does this automatically for us if `fileName` is a string,
 * but we want our cjs module to be '.js' while still using ES Module
 * imports in our vite config.
 *
 * If package.json does not contain 'type': 'module', Vite swaps some file extensions out.
 * Short explanation in a note at https://vitejs.dev/guide/build.html#library-mode
 *
 * @param moduleFormat Vite-official module formats are listed at https://vitejs.dev/config/build-options.html#build-lib but you can use any rollup module format
 */
export function getFileExtensionByModuleFormat(moduleFormat: ModuleFormat) {
  switch (moduleFormat) {
    case "es":
      return "js";
    case "cjs":
      return "js"; // Vite uses '.cjs' if package.json has "type": "module", but Paranext uses commonjs modules, so let's just use 'js'
    case "umd":
      return "umd.cjs";
    default:
      return `${moduleFormat}.js`;
  }
}

/**
 * Get a list of TypeScript WebView files to transpile.
 * Path relative to project root
 */
export function getWebViewTsxPaths() {
  return glob(webViewTsxGlob, { ignore: "node_modules/**" });
}

/**
 * Formats a WebView import module path to read its built version
 * @param moduleSourceRaw whole module import string including quotes e.g. `"./my.web-view"`
 * @returns WebView import module path with temporary WebView directory inserted into the module path
 */
export function insertWebViewTempDir(moduleSourceRaw: string) {
  // Note the style of quotes used
  const quote = moduleSourceRaw.at(0);
  // Get rid of the quotes
  const importPath = moduleSourceRaw.slice(1, -1);
  const importInfo = path.parse(importPath);
  const newPath = [importInfo.dir, webViewTempDir, importInfo.base].join("/");
  const finalModuleSource = `${quote}${newPath}${quote}`;
  return finalModuleSource;
}

// #endregion
