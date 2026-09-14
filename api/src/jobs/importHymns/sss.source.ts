import { readFile } from "node:fs/promises";
import { ExternalServiceError } from "@zudojs/errors";
import type { HymnalUpsertInput, SourceUpsertInput } from "../../repositories/index.js";

/** Commit of techoveride/Sacred_Songs_and_Solos the import is pinned to. */
export const SSS_SOURCE_COMMIT = "752bef4ebee069bc9df0fb9de63d29c46a835d75";

export const SSS_SOURCE_URL = `https://raw.githubusercontent.com/techoveride/Sacred_Songs_and_Solos/${SSS_SOURCE_COMMIT}/lib/model/hymn.dart`;

/** Number of hymns in the 1200-piece edition; later entries in the dataset are modern anthems. */
export const SSS_HYMN_COUNT = 1200;

export const SSS_SOURCE: SourceUpsertInput = Object.freeze({
  slug: "sacred-songs-and-solos-techoveride",
  name: "Sacred Songs and Solos, 1200 pieces (OCR transcription in techoveride/Sacred_Songs_and_Solos)",
  url: SSS_SOURCE_URL,
  edition: "1200 pieces",
  license: "Repository published under the MIT License; hymn texts are public domain.",
  rightsStatus: "public-domain",
  retrievedAt: new Date("2026-09-13T00:00:00.000Z"),
  notes: "OCR-derived text cleaned on import; the two modern anthems appended to the dataset are excluded.",
});

export const SSS_HYMNAL: Omit<HymnalUpsertInput, "sourceId"> = Object.freeze({
  slug: "sacred-songs-and-solos",
  title: "Sacred Songs and Solos",
  edition: "1200 pieces",
  publisher: "Morgan and Scott",
  description: "Compiled under the direction of Ira D. Sankey. Widely used in Nigerian congregations.",
  rightsStatus: "public-domain",
});

export interface SssDatasetLocation {
  readonly file?: string;
  readonly url?: string;
}

/** Loads the raw Dart source that embeds the hymns. */
export async function loadSssDataset(location: SssDatasetLocation = {}): Promise<string> {
  if (location.file !== undefined) {
    return readFile(location.file, "utf8");
  }
  const url = location.url ?? SSS_SOURCE_URL;
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) {
    throw new ExternalServiceError(`Downloading the Sacred Songs and Solos dataset failed with HTTP ${response.status}.`, {
      service: "github",
      metadata: { url },
    });
  }
  return response.text();
}
