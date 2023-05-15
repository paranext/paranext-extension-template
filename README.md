# paranext-extension-template
Basic extension template for Paranext

## Summary

This is a Vite project template pre-configured to build Paranext extensions.

 - `lib` contains the source code for the extension
   - `lib/main.ts` is the main entry file for the extension
   - `*.web-view.tsx` files will be treated as React WebViews
   - `*.web-view.ejs` files will be treated as HTML WebViews
 - `public` contains static files that are transferred to the build folder
   - `public/manifest.json` is the manifest file that defines the extension
   - `public/package.json` defines the npm package for this extension and is required for Paranext to use it appropriately
   - `public/paranext-extension-template.d.ts` is this extension's types file that other extensions can use
 - `dist` is a generated folder containing your built extension files

## To install

### Configure paths to `paranext-core` repo

In order to interact with `paranext-core`, you must point `package.json` to your installed `paranext-core` repository:

1. Follow the instructions to install [`paranext-core`](https://github.com/paranext/paranext-core#developer-install). We recommend you clone `paranext-core` in the same parent directory in which you cloned this repository so you do not have to reconfigure paths to `paranext-core`.
2. If you cloned `paranext-core` anywhere other than in the same parent directory in which you cloned this repository, update the paths to `paranext-core` in this repository's `package.json` to point to the correct `paranext-core` directory.

### Install dependencies

Run `npm install` to install local and published dependencies

## To run

### Running Paranext with your extension

To run Paranext with your extension:

`npm start`

Note: The built extension will be in the `dist` folder. In order for Paranext to run your extension, you must provide the directory to your built extension to Paranext via a command-line argument. This command-line argument is already provided in this `package.json`'s `start` script. If you want to start Paranext and use your extension any other way, you must provide this command-line argument or put the `dist` folder into Paranext's `extensions` folder.

### Building your extension independently

To watch extension files (in `lib`) for changes:

`npm run start:vite`

To build the extension once:

`npm run build:vite`

## Vite Build Explanation

This extension template is built by Vite in two steps: a WebView transpilation step and a packaging step:

## Build 1: TypeScript WebView transpilation

Vite prepares TypeScript WebViews for use and outputs them into `temp-vite` folders adjacent to the WebView files:
- Formats WebViews to match how they should look to work in Paranext
- Transpiles React/TypeScript WebViews into JavaScript
- Packages dependencies into the WebViews
- Embeds Sourcemaps into the WebViews inline

## Built 2: Packaging

Vite packages the extension together into the `dist` folder:
- Transpiles the main TypeScript file and its imported modules into JavaScript
- Injects the WebViews into the main file
- Packages dependencies into the main file
- Generates sourcemaps for the file
- Packages everything up into an extension folder in `dist`

Note: When performing the second build step, the following line may occur in your console. Please feel free to ignore it as it is a false positive. It is likely showing because WebViews are embedded in the entry file:

```bash
transforming (1) lib\main.ts[plugin:ImportManager] It seems like there are multiple imports of module 'react'. You should examine that.
```
