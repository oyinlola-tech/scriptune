import { describe, expect, it } from "vitest";
import { recognizeAudioFieldsSchema, recognizeTextBodySchema } from "../../src/validators/recognition.validators.js";

describe("recognition language", () => {
  it("defaults to auto so any language is searched", () => {
    expect(recognizeTextBodySchema.parse({ text: "amazing grace" }).language).toBe("auto");
    expect(recognizeAudioFieldsSchema.parse({}).language).toBe("auto");
  });

  it("accepts explicit ISO codes and rejects anything else", () => {
    expect(recognizeTextBodySchema.parse({ text: "Ọlọrun mi", language: "yo" }).language).toBe("yo");
    expect(recognizeAudioFieldsSchema.parse({ language: "auto" }).language).toBe("auto");
    expect(() => recognizeTextBodySchema.parse({ text: "hello", language: "English" })).toThrow();
  });
});
