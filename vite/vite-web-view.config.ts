/**
 * First Vite build step for transpiling WebViews
 */

import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { importManager } from "rollup-plugin-import-manager";
import {
  getFileExtensionByModuleFormat,
  paranextProvidedModules,
  webViewGlob,
  webViewTsxGlob,
} from "./vite.util";
import { globSync } from "glob";

/** List of WebView files to transpile */
const webViews = globSync(webViewGlob);
console.log(JSON.stringify(webViews));

/** Tracks which entry file we're working with in determining the file name. */
let entryFileIndex = 0;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // use React.createElement
    react({ jsxRuntime: "classic" }),
    // Remove the Paranext global modules from the imports in React web views because they are provided globally
    importManager({
      include: webViewTsxGlob,
      units: paranextProvidedModules.map((module) => ({
        module,
        actions: "remove",
      })),
    }),
  ],
  build: {
    // This project is a library as it is being used in Paranext
    lib: {
      // List each WebView file as an entry file because each needs to be transpiled
      entry: webViews.map((webView) => path.resolve(__dirname, webView)),
      /**
       * Get the output file name for each WebView.
       *
       * WARNING: We're assuming the file name function runs in order. We will
       * throw if we notice any issues with this assumption, but there is a
       * possibility that two different WebViews named the same in two different
       * files could get swapped if Vite doesn't play by our assumption.
       */
      fileName: (moduleFormat, entryName) => {
        // Get the corresponding webView file for this entry
        const webViewFilePath = webViews[entryFileIndex];
        const webViewFileInfo = path.parse(webViewFilePath);
        if (entryName !== webViewFileInfo.name)
          throw new Error(
            `Error building in Vite: entryName ${entryName} does not match WebView file name ${webViewFileInfo.name}! File path: ${webViewFilePath} entryFileIndex ${entryFileIndex}`
          );
        // Set up the next call to this function to get the next WebView file
        entryFileIndex += 1;

        return path.join(
          entryName,
          `${entryName}.${getFileExtensionByModuleFormat(moduleFormat)}`
        );
      },
      // Output to cjs format as that's what Paranext supports. In production, es modules fail to
      // shim over import and deliver papi for some reason.
      formats: ["cjs"],
    },
    rollupOptions: {
      // Do not bundle papi because it will be imported in Paranext
      external: paranextProvidedModules,
    },
    // Bundle the sourcemap into the webview file since it will be injected as a string
    // into the main file
    sourcemap: "inline",
    // We are placing the built WebView files next to their original files
    outDir: "lib",
    // We do not want to erase the lib folder!
    emptyOutDir: false,
  },
});
