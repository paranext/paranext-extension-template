import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { string as importString } from "rollup-plugin-string";
import { importManager } from "rollup-plugin-import-manager";

/*
 * Glob filename matcher for web views.
 * React Web Views should be named <name>.web-view.tsx
 * HTML Web Views should be named <name>.web-view.ejs
 *  - Note: the HTML web views are .ejs files because rollup was not recognizing them to have exports for some reason.
 */
const webViewGlob = "**/*.web-view.(tsx|ejs)";
const webViewTsxGlob = "**/*.web-view.tsx";

/** Modules that Paranext supplies so extensions can use them easily */
const paranextProvidedModules = ["react", "react-dom/client", "papi"];

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
      entry: path.resolve(__dirname, "lib/main.ts"),
      // The output file name for the extension (file extension is appended)
      fileName: "paranext-extension-template",
      // Output to cjs format as that's what Paranext supports
      formats: ["cjs"],
    },
    rollupOptions: {
      // Do not bundle papi because it will be imported in Paranext
      external: paranextProvidedModules,
    },
  },
});
