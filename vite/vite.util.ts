import { ModuleFormat } from "rollup";

/*
 * Glob filename matcher for web views.
 * React Web Views should be named <name>.web-view.tsx
 * HTML Web Views should be named <name>.web-view.ejs
 *  - Note: the HTML web views are .ejs files because rollup was not recognizing them to have exports for some reason.
 */
export const webViewGlob = "../lib/*.web-view.(tsx|ejs)";
export const webViewTsxGlob = "**/*.web-view.tsx";

/** Modules that Paranext supplies so extensions can use them easily */
export const paranextProvidedModules = ["react", "react-dom/client", "papi"];

/**
 * Gets a file extension based on the moduleFormat input.
 * Vite does this better automatically for us if `fileName` is a string,
 * but we need to do this since fileName is a function. :(
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
      return "js"; // 'cjs' if package.json has "type": "module", but Paranext uses commonjs modules
    case "umd":
      return "umd.cjs";
    default:
      return `${moduleFormat}.js`;
  }
}
