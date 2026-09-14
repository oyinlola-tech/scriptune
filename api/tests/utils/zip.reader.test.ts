import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { listZipEntries, readZipEntry } from "../../src/utils/zip/index.js";

/** Builds a one-entry zip archive in memory, the way a zip tool would. */
function makeZip(name: string, content: string, deflate: boolean): Buffer {
  const raw = Buffer.from(content, "utf8");
  const data = deflate ? deflateRawSync(raw) : raw;
  const nameBytes = Buffer.from(name, "utf8");
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(deflate ? 8 : 0, 8); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(nameBytes.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(deflate ? 8 : 0, 10); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(nameBytes.length, 28); central.writeUInt32LE(0, 42);
  const centralOffset = local.length + nameBytes.length + data.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10); eocd.writeUInt32LE(central.length + nameBytes.length, 12); eocd.writeUInt32LE(centralOffset, 16);
  return Buffer.concat([local, nameBytes, data, central, nameBytes, eocd]);
}

describe("zip reader", () => {
  it("lists and extracts deflated and stored entries", () => {
    for (const deflate of [true, false]) {
      const archive = makeZip("eng-web_vpl.txt", "GEN 1:1 In the beginning", deflate);
      expect(listZipEntries(archive)).toEqual(["eng-web_vpl.txt"]);
      expect(readZipEntry(archive, "eng-web_vpl.txt").toString("utf8")).toBe("GEN 1:1 In the beginning");
    }
  });

  it("rejects missing entries and non-archives", () => {
    expect(() => readZipEntry(makeZip("a.txt", "x", true), "b.txt")).toThrow(/no entry/);
    expect(() => listZipEntries(Buffer.from("not a zip at all"))).toThrow(/not a zip/);
  });
});
