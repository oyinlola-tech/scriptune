/**
 * A short, well-loved set of verses for the "verse of the day" widgets.
 * Bundled with the clients so the widget needs no network, and shared so web
 * and Android show the same verse on the same day. The iOS WidgetKit
 * extension keeps its own copy in Swift; keep the two in step when editing.
 * Text is the King James Version (public domain).
 */
export interface DailyVerse {
  reference: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export const DAILY_VERSES: readonly DailyVerse[] = [
  { reference: "John 3:16", translation: "KJV", book: "john", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { reference: "Psalm 23:1", translation: "KJV", book: "psalms", chapter: 23, verse: 1, text: "The Lord is my shepherd; I shall not want." },
  { reference: "Proverbs 3:5", translation: "KJV", book: "proverbs", chapter: 3, verse: 5, text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding." },
  { reference: "Philippians 4:13", translation: "KJV", book: "philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me." },
  { reference: "Isaiah 40:31", translation: "KJV", book: "isaiah", chapter: 40, verse: 31, text: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles." },
  { reference: "Romans 8:28", translation: "KJV", book: "romans", chapter: 8, verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { reference: "Joshua 1:9", translation: "KJV", book: "joshua", chapter: 1, verse: 9, text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest." },
  { reference: "Jeremiah 29:11", translation: "KJV", book: "jeremiah", chapter: 29, verse: 11, text: "For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end." },
  { reference: "Matthew 11:28", translation: "KJV", book: "matthew", chapter: 11, verse: 28, text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
  { reference: "Psalm 46:1", translation: "KJV", book: "psalms", chapter: 46, verse: 1, text: "God is our refuge and strength, a very present help in trouble." },
  { reference: "Proverbs 18:10", translation: "KJV", book: "proverbs", chapter: 18, verse: 10, text: "The name of the Lord is a strong tower: the righteous runneth into it, and is safe." },
  { reference: "2 Timothy 1:7", translation: "KJV", book: "2-timothy", chapter: 1, verse: 7, text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind." },
  { reference: "Psalm 118:24", translation: "KJV", book: "psalms", chapter: 118, verse: 24, text: "This is the day which the Lord hath made; we will rejoice and be glad in it." },
  { reference: "Isaiah 41:10", translation: "KJV", book: "isaiah", chapter: 41, verse: 10, text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee." },
  { reference: "Lamentations 3:22", translation: "KJV", book: "lamentations", chapter: 3, verse: 22, text: "It is of the Lord's mercies that we are not consumed, because his compassions fail not." },
  { reference: "1 Corinthians 13:4", translation: "KJV", book: "1-corinthians", chapter: 13, verse: 4, text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up." },
  { reference: "Psalm 27:1", translation: "KJV", book: "psalms", chapter: 27, verse: 1, text: "The Lord is my light and my salvation; whom shall I fear? the Lord is the strength of my life; of whom shall I be afraid?" },
  { reference: "Matthew 6:33", translation: "KJV", book: "matthew", chapter: 6, verse: 33, text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you." },
  { reference: "Hebrews 11:1", translation: "KJV", book: "hebrews", chapter: 11, verse: 1, text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
  { reference: "Psalm 121:1", translation: "KJV", book: "psalms", chapter: 121, verse: 1, text: "I will lift up mine eyes unto the hills, from whence cometh my help." },
  { reference: "Nahum 1:7", translation: "KJV", book: "nahum", chapter: 1, verse: 7, text: "The Lord is good, a strong hold in the day of trouble; and he knoweth them that trust in him." },
  { reference: "John 14:6", translation: "KJV", book: "john", chapter: 14, verse: 6, text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me." },
  { reference: "Psalm 34:8", translation: "KJV", book: "psalms", chapter: 34, verse: 8, text: "O taste and see that the Lord is good: blessed is the man that trusteth in him." },
  { reference: "Galatians 5:22", translation: "KJV", book: "galatians", chapter: 5, verse: 22, text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith." },
  { reference: "Deuteronomy 31:6", translation: "KJV", book: "deuteronomy", chapter: 31, verse: 6, text: "Be strong and of a good courage, fear not: for the Lord thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee." },
  { reference: "Psalm 55:22", translation: "KJV", book: "psalms", chapter: 55, verse: 22, text: "Cast thy burden upon the Lord, and he shall sustain thee: he shall never suffer the righteous to be moved." },
  { reference: "Micah 6:8", translation: "KJV", book: "micah", chapter: 6, verse: 8, text: "He hath shewed thee, O man, what is good; and what doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?" },
  { reference: "1 Peter 5:7", translation: "KJV", book: "1-peter", chapter: 5, verse: 7, text: "Casting all your care upon him; for he careth for you." },
  { reference: "Psalm 37:4", translation: "KJV", book: "psalms", chapter: 37, verse: 4, text: "Delight thyself also in the Lord; and he shall give thee the desires of thine heart." },
  { reference: "Romans 12:2", translation: "KJV", book: "romans", chapter: 12, verse: 2, text: "And be not conformed to this world: but be ye transformed by the renewing of your mind." },
  { reference: "Zephaniah 3:17", translation: "KJV", book: "zephaniah", chapter: 3, verse: 17, text: "The Lord thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy." },
];

/** The verse for a given date, stable for the whole day, rotating through the set. */
export function verseForDate(date: Date = new Date()): DailyVerse {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86_400_000);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length]!;
}
