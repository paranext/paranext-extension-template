# paranext-extension-template
Basic extension template for Paranext

## Summary

This is a webpack project template pre-configured to build Paranext extensions.

 - `lib` contains the source code for the extension
   - `lib/main.ts` is the main entry file for the extension
   - `lib/types/paranext-extension-template.d.ts` is this extension's types file that defines how other extensions can use this extension through the `papi`
   - `*.web-view.tsx` files will be treated as React WebViews
   - `*.web-view.ejs` files will be treated as HTML WebViews
 - `public` contains static files that are transferred to the build folder
   - `public/manifest.json` is the manifest file that defines the extension
   - `public/package.json` defines the npm package for this extension and is required for Paranext to use it appropriately
   - `public/assets` contains asset files the extension and its WebViews can retrieve using the `papi-extension:` protocol
 - `build` is a generated folder containing your built extension files
 - `dist` is a generated folder containing a zip of your built extension files

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

Note: The built extension will be in the `build` folder. In order for Paranext to run your extension, you must provide the directory to your built extension to Paranext via a command-line argument. This command-line argument is already provided in this `package.json`'s `start` script. If you want to start Paranext and use your extension any other way, you must provide this command-line argument or put the `build` folder into Paranext's `extensions` folder.

### Building your extension independently

To watch extension files (in `lib`) for changes:

`npm run watch`

To build the extension once:

`npm run build`

## To package for distribution

To package your extension into a zip file for distribution:

`npm run package`

## Webpack Build Explanation

This extension template is built by webpack (`webpack.config.ts`) in two steps: a WebView bundling step and a main bundling step:

## Build 1: TypeScript WebView Bundling

Webpack (`./webpack/webpack.config.web-view.ts`) prepares TypeScript WebViews for use and outputs them into `temp-webpack` folders adjacent to the WebView files:
- Formats WebViews to match how they should look to work in Paranext
- Transpiles React/TypeScript WebViews into JavaScript
- Bundles dependencies into the WebViews
- Embeds Sourcemaps into the WebViews inline

## Build 2: Main and Final Bundling

Webpack (`./webpack/webpack.config.main.ts`) prepares the main extension file and bundles the extension together into the `build` folder:
- Transpiles the main TypeScript file and its imported modules into JavaScript
- Injects the bundled WebViews into the main file
- Bundles dependencies into the main file
- Embeds Sourcemaps into the file inline
- Packages everything up into an extension folder `build`
