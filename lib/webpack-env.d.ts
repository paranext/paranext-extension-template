/** Modules provided by webpack.config.ts */

// #region code and things

/**
 * Import fully loaded and transformed files as strings with "./file?inline"
 *
 * WARNING: These files are NOT bundled. The rules are applied, but webpack does not bundle
 * dependencies into these files before providing them, unfortunately.
 */
declare module "*?inline" {
  const content: string;
  export default content;
}

/**
 * Import files with no transformation as strings with "./file?raw"
 */
declare module "*?raw" {
  const content: string;
  export default content;
}

/**
 * Import scss, sass, and css files as strings
 */
declare module "*.scss" {
  const content: string;
  export default content;
}

/**
 * Import scss, sass, and css files as strings
 */
declare module "*.sass" {
  const content: string;
  export default content;
}

/**
 * Import scss, sass, and css files as strings
 */
declare module "*.css" {
  const content: string;
  export default content;
}

// #endregion

// #region images

/**
 * Load images as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.png" {
  const content: string;
  export default content;
}

/**
 * Load images as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.svg" {
  const content: string;
  export default content;
}

/**
 * Load images as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.jpg" {
  const content: string;
  export default content;
}

/**
 * Load images as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.jpeg" {
  const content: string;
  export default content;
}

/**
 * Load images as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.gif" {
  const content: string;
  export default content;
}

// #endregion

// #region fonts

/**
 * Load fonts as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.woff" {
  const content: string;
  export default content;
}

/**
 * Load fonts as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.woff2" {
  const content: string;
  export default content;
}

/**
 * Load fonts as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.eot" {
  const content: string;
  export default content;
}

/**
 * Load fonts as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.ttf" {
  const content: string;
  export default content;
}

/**
 * Load fonts as data uris
 *
 * Note: it is advised to use the `papi-extension:` protocol to load assets as data uris are
 * not currently supported in Platform.Bible
 */
declare module "*.otf" {
  const content: string;
  export default content;
}

// #endregion
