/**
 * Controllers translate HTTP requests into commands and queries.
 *
 * They hold no business logic: validate input, dispatch to a bus, shape the
 * response.
 *
 * @module controllers
 */
export * from "./account.controller.js";
export * from "./auth.controller.js";
export * from "./bible.controller.js";
export * from "./hymns.controller.js";
export * from "./library/index.js";
export * from "./recognition.controller.js";
export * from "./search.controller.js";
export * from "./system/index.js";
