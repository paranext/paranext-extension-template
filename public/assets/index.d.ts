// This file is here to make tsconfig accept that we want types from `public` without getting angry
// that we have the `assets` folder that doesn't have or need types.
// We can remove it if/when we move `paranext-extension-template.d.ts` to a different place and
// remove `public` from `typeRoots` in `tsconfig.json`
