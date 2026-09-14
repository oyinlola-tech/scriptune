import type { Container } from "@zudojs/container";
import type { Module } from "@zudojs/core";
import { ConflictError } from "@zudojs/errors";
import { BibleModule } from "../modules/bible/index.js";
import { DatabaseModule } from "../modules/database/index.js";
import { HttpModule } from "../modules/http/index.js";
import { HymnsModule } from "../modules/hymns/index.js";
import { IdentityModule } from "../modules/identity/index.js";
import { LibraryModule } from "../modules/library/index.js";
import { RecognitionModule } from "../modules/recognition/index.js";
import { SearchModule } from "../modules/search/index.js";
import { TranscriptionModule } from "../modules/transcription/index.js";

/** Builds the module map from a list, rejecting duplicate ids. */
export function toModuleMap(modules: readonly Module[]): ReadonlyMap<string, Module> {
  const map = new Map<string, Module>();
  for (const module of modules) {
    if (map.has(module.id)) {
      throw new ConflictError(`Module "${module.id}" is registered twice.`);
    }
    map.set(module.id, module);
  }
  return map;
}

/** The modules that make up the API, in declaration order. */
export function loadModules(container: Container): ReadonlyMap<string, Module> {
  return toModuleMap([
    new HttpModule(container),
    new DatabaseModule(container),
    new BibleModule(container),
    new HymnsModule(container),
    new SearchModule(container),
    new IdentityModule(container),
    new LibraryModule(container),
    new TranscriptionModule(container),
    new RecognitionModule(container),
  ]);
}

/** The modules needed for headless jobs such as data imports. */
export function loadHeadlessModules(container: Container): ReadonlyMap<string, Module> {
  return toModuleMap([
    new DatabaseModule(container),
    new BibleModule(container, { http: false }),
    new HymnsModule(container, { http: false }),
  ]);
}
