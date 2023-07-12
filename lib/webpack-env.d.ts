/** Modules provided by webpack.config.ts */

/**
 * Import fully transformed files as strings with "./file?transformed"
 *
 * WARNING: These files are NOT bundled. The rules are applied, but webpack does not bundle
 * these files before providing them, unfortunately.
 */
declare module "*?transformed" {
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
