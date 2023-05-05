/**
 * Second Vite build step for transpiling main and packaging into an extension
 */

import { defineConfig } from "vite";
import path from "path";
import { string as importString } from "rollup-plugin-string";
import { paranextProvidedModules, webViewGlob, webViewTsxGlob } from "./vite.util";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Import web view files as strings to pass on the papi
    // importString plugin must be after any other plugins that need to transpile these files
    {
      ...importString({
        include: webViewGlob,
      }),
      enforce: "post",
    },
  ],
  build: {
    // This project is a library as it is being used in Paranext
    lib: {
      // The main entry file of the extension
      entry: path.resolve(__dirname, "../lib/main.ts"),
      // The output file name for the extension (file extension is appended)
      fileName: "paranext-extension-template",
      // Output to cjs format as that's what Paranext supports
      formats: ["cjs"],
    },
    rollupOptions: {
      // Do not bundle papi because it will be imported in Paranext
      external: paranextProvidedModules,
    },
    // Generate sourcemaps as separate files since VSCode can load them directly
    sourcemap: true,
  },
});
