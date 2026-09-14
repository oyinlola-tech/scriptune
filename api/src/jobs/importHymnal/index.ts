/**
 * Imports any hymnal from a JSON file, with its own rights status. Used for
 * collections beyond the public-domain default, such as a church's own
 * hymnbook contributed with permission.
 *
 * @module jobs/importHymnal
 */
export * from "./hymnalFile.schema.js";
export * from "./importHymnal.job.js";
