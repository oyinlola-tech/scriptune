import { CANONICAL_BOOKS } from "../../src/constants/index.js";

/** Builds a scrollmapper-shaped dataset with 66 books, most of them empty. */
export function createKjvFixture(): unknown {
  return {
    translation: "KJV test fixture",
    books: CANONICAL_BOOKS.map((book) => {
      if (book.slug === "genesis") {
        return {
          name: "Genesis",
          chapters: [
            {
              chapter: 1,
              verses: [
                { verse: 1, text: "In the beginning God created the heaven and the earth." },
                { verse: 2, text: "And the earth was without form, and void; and darkness was upon the face of the deep." },
                { verse: 3, text: "And God said, Let there be light: and there was light." },
              ],
            },
          ],
        };
      }
      if (book.slug === "john") {
        return {
          name: "John",
          chapters: [
            { chapter: 1, verses: [{ verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." }] },
            { chapter: 2, verses: [] },
            {
              chapter: 3,
              verses: [
                { verse: 15, text: "That whosoever believeth in him should not perish, but have eternal life." },
                { verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
                { verse: 17, text: "For God sent not his Son into the world to condemn the world; [but] that the world through him might be saved." },
              ],
            },
          ],
        };
      }
      return { name: book.name, chapters: [] };
    }),
  };
}
