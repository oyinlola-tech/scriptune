import { inflateRawSync } from "node:zlib";

/** Refuse a single entry that would inflate past this, to stop zip bombs. */
const MAX_ENTRY_BYTES = 64 * 1024 * 1024;
import { ValidationError } from "@zudojs/errors";

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

/** Lists the entry names of a zip archive by walking its central directory. */
export function listZipEntries(archive: Buffer): readonly string[] {
  const names: string[] = [];
  for (const entry of readCentralDirectory(archive)) names.push(entry.name);
  return names;
}

/**
 * Extracts one entry from a zip archive held in memory. Only stored and
 * deflated entries are supported, which covers every archive eBible.org
 * publishes. Kept tiny on purpose: a dependency is not worth it for this.
 */
export function readZipEntry(archive: Buffer, name: string): Buffer {
  const entry = readCentralDirectory(archive).find((candidate) => candidate.name === name);
  if (entry === undefined) {
    throw new ValidationError(`The archive has no entry named "${name}".`);
  }
  if (archive.readUInt32LE(entry.localOffset) !== LOCAL_SIGNATURE) {
    throw new ValidationError(`Zip entry "${name}" has a corrupt local header.`);
  }
  const nameLength = archive.readUInt16LE(entry.localOffset + 26);
  const extraLength = archive.readUInt16LE(entry.localOffset + 28);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  if (start < 0 || start + entry.compressedSize > archive.length) {
    throw new ValidationError(`Zip entry "${name}" points outside the archive.`);
  }
  const raw = archive.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return Buffer.from(raw);
  if (entry.method === 8) {
    try {
      return inflateRawSync(raw, { maxOutputLength: MAX_ENTRY_BYTES });
    } catch {
      throw new ValidationError(`Zip entry "${name}" is corrupt or too large.`);
    }
  }
  throw new ValidationError(`Zip entry "${name}" uses unsupported compression method ${entry.method}.`);
}

interface CentralEntry {
  readonly name: string;
  readonly method: number;
  readonly compressedSize: number;
  readonly localOffset: number;
}

function readCentralDirectory(archive: Buffer): readonly CentralEntry[] {
  let eocd = -1;
  for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 65_557); offset -= 1) {
    if (archive.readUInt32LE(offset) === EOCD_SIGNATURE) {
      eocd = offset;
      break;
    }
  }
  if (eocd === -1) throw new ValidationError("The download is not a zip archive.");
  const count = archive.readUInt16LE(eocd + 10);
  let offset = archive.readUInt32LE(eocd + 16);
  const entries: CentralEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    if (offset < 0 || offset + 46 > archive.length || archive.readUInt32LE(offset) !== CENTRAL_SIGNATURE) throw new ValidationError("The zip central directory is corrupt.");
    const nameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    entries.push({
      method: archive.readUInt16LE(offset + 10),
      compressedSize: archive.readUInt32LE(offset + 20),
      localOffset: archive.readUInt32LE(offset + 42),
      name: archive.toString("utf8", offset + 46, offset + 46 + nameLength),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
