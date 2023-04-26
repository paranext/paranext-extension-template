# paranext-extension-template
Basic extension template for Paranext

## Summary

This is a Vite project template pre-configured to build Paranext extensions.
 - `lib` contains the source code for the extension
   - `lib/main.ts` is the main entry file for the extension
   - `*.web-view.tsx` files will be treated as React WebViews
   - `*.web-view.ejs` files will be treated as HTML WebViews
 - `public/manifest.json` is the manifest file that defines the extension

## To run

Install dependencies:

1. In order to have types for `papi`, we must build the `papi-dts` package locally (currently, `papi-dts` is a local package and is not published on `npm`):
   1. Follow the instructions to install [`paranext-core`](https://github.com/paranext/paranext-core#developer-install). If you are just building `papi-dts`, you do not need to follow the `dotnet` installation instructions. We recommend you clone `paranext-core` in the same parent directory in which you cloned this repository as it will make `papi-dts` installation simpler.
   2. In `paranext-core`, run `npm run build:types` to generate the `papi-dts` package.
   3. If you cloned `paranext-core` anywhere other than in the same parent directory in which you cloned this repository, you must update the path to `papi-dts` in this repository's `package.json` to point to the correct `paranext-core` directory.
2. Run `npm install` to install local and published dependencies

To watch extension files (in `lib`) for changes:

`npm start`

## To publish

To build the extension once:

`npm run build`

The extension will be the `dist` folder. You can copy this folder into Paranext's `extensions` folder, launch Paranext, and see it run!
