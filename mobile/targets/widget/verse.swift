import SwiftUI
import WidgetKit

// Verse of the day. Kept in sync with packages/contracts/src/verses.ts by hand
// (a WidgetKit extension cannot read the JS bundle). Text is the King James Version.
struct Verse {
  let reference: String
  let url: String
  let text: String
  let translation: String
}

let dailyVerses: [Verse] = [
    Verse(reference: "John 3:16", url: "scriptune://bible/kjv/john/3/16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", translation: "KJV"),
    Verse(reference: "Psalm 23:1", url: "scriptune://bible/kjv/psalms/23/1", text: "The Lord is my shepherd; I shall not want.", translation: "KJV"),
    Verse(reference: "Proverbs 3:5", url: "scriptune://bible/kjv/proverbs/3/5", text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding.", translation: "KJV"),
    Verse(reference: "Philippians 4:13", url: "scriptune://bible/kjv/philippians/4/13", text: "I can do all things through Christ which strengtheneth me.", translation: "KJV"),
    Verse(reference: "Isaiah 40:31", url: "scriptune://bible/kjv/isaiah/40/31", text: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.", translation: "KJV"),
    Verse(reference: "Romans 8:28", url: "scriptune://bible/kjv/romans/8/28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", translation: "KJV"),
    Verse(reference: "Joshua 1:9", url: "scriptune://bible/kjv/joshua/1/9", text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.", translation: "KJV"),
    Verse(reference: "Jeremiah 29:11", url: "scriptune://bible/kjv/jeremiah/29/11", text: "For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.", translation: "KJV"),
    Verse(reference: "Matthew 11:28", url: "scriptune://bible/kjv/matthew/11/28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", translation: "KJV"),
    Verse(reference: "Psalm 46:1", url: "scriptune://bible/kjv/psalms/46/1", text: "God is our refuge and strength, a very present help in trouble.", translation: "KJV"),
    Verse(reference: "Proverbs 18:10", url: "scriptune://bible/kjv/proverbs/18/10", text: "The name of the Lord is a strong tower: the righteous runneth into it, and is safe.", translation: "KJV"),
    Verse(reference: "2 Timothy 1:7", url: "scriptune://bible/kjv/2-timothy/1/7", text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", translation: "KJV"),
    Verse(reference: "Psalm 118:24", url: "scriptune://bible/kjv/psalms/118/24", text: "This is the day which the Lord hath made; we will rejoice and be glad in it.", translation: "KJV"),
    Verse(reference: "Isaiah 41:10", url: "scriptune://bible/kjv/isaiah/41/10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.", translation: "KJV"),
    Verse(reference: "Lamentations 3:22", url: "scriptune://bible/kjv/lamentations/3/22", text: "It is of the Lord's mercies that we are not consumed, because his compassions fail not.", translation: "KJV"),
    Verse(reference: "1 Corinthians 13:4", url: "scriptune://bible/kjv/1-corinthians/13/4", text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.", translation: "KJV"),
    Verse(reference: "Psalm 27:1", url: "scriptune://bible/kjv/psalms/27/1", text: "The Lord is my light and my salvation; whom shall I fear? the Lord is the strength of my life; of whom shall I be afraid?", translation: "KJV"),
    Verse(reference: "Matthew 6:33", url: "scriptune://bible/kjv/matthew/6/33", text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.", translation: "KJV"),
    Verse(reference: "Hebrews 11:1", url: "scriptune://bible/kjv/hebrews/11/1", text: "Now faith is the substance of things hoped for, the evidence of things not seen.", translation: "KJV"),
    Verse(reference: "Psalm 121:1", url: "scriptune://bible/kjv/psalms/121/1", text: "I will lift up mine eyes unto the hills, from whence cometh my help.", translation: "KJV"),
    Verse(reference: "Nahum 1:7", url: "scriptune://bible/kjv/nahum/1/7", text: "The Lord is good, a strong hold in the day of trouble; and he knoweth them that trust in him.", translation: "KJV"),
    Verse(reference: "John 14:6", url: "scriptune://bible/kjv/john/14/6", text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.", translation: "KJV"),
    Verse(reference: "Psalm 34:8", url: "scriptune://bible/kjv/psalms/34/8", text: "O taste and see that the Lord is good: blessed is the man that trusteth in him.", translation: "KJV"),
    Verse(reference: "Galatians 5:22", url: "scriptune://bible/kjv/galatians/5/22", text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.", translation: "KJV"),
    Verse(reference: "Deuteronomy 31:6", url: "scriptune://bible/kjv/deuteronomy/31/6", text: "Be strong and of a good courage, fear not: for the Lord thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.", translation: "KJV"),
    Verse(reference: "Psalm 55:22", url: "scriptune://bible/kjv/psalms/55/22", text: "Cast thy burden upon the Lord, and he shall sustain thee: he shall never suffer the righteous to be moved.", translation: "KJV"),
    Verse(reference: "Micah 6:8", url: "scriptune://bible/kjv/micah/6/8", text: "He hath shewed thee, O man, what is good; and what doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?", translation: "KJV"),
    Verse(reference: "1 Peter 5:7", url: "scriptune://bible/kjv/1-peter/5/7", text: "Casting all your care upon him; for he careth for you.", translation: "KJV"),
    Verse(reference: "Psalm 37:4", url: "scriptune://bible/kjv/psalms/37/4", text: "Delight thyself also in the Lord; and he shall give thee the desires of thine heart.", translation: "KJV"),
    Verse(reference: "Romans 12:2", url: "scriptune://bible/kjv/romans/12/2", text: "And be not conformed to this world: but be ye transformed by the renewing of your mind.", translation: "KJV"),
    Verse(reference: "Zephaniah 3:17", url: "scriptune://bible/kjv/zephaniah/3/17", text: "The Lord thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy.", translation: "KJV"),
]

func verseForToday() -> Verse {
  let day = Calendar(identifier: .gregorian).ordinality(of: .day, in: .year, for: Date()) ?? 1
  return dailyVerses[(day - 1) % dailyVerses.count]
}

struct VerseWidgetView: View {
  @Environment(\.widgetFamily) private var family
  var entry: StaticEntry
  private var verse: Verse { verseForToday() }

  var body: some View {
    switch family {
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        Text(verse.reference).font(.headline)
        Text(verse.text).font(.caption2).lineLimit(2)
      }
      .containerBackground(for: .widget) { Color.clear }
      .widgetURL(URL(string: verse.url))
    default:
      VStack(alignment: .leading, spacing: 8) {
        Text("VERSE OF THE DAY").font(.system(size: 10, weight: .semibold)).tracking(1.5).foregroundStyle(Color("gold"))
        Text("\u{201C}\(verse.text)\u{201D}")
          .font(.system(size: family == .systemLarge ? 20 : 15, design: .serif))
          .foregroundStyle(Color("text"))
          .lineLimit(family == .systemLarge ? 8 : 4)
        Spacer(minLength: 0)
        Text("\(verse.reference) \u{00B7} \(verse.translation)").font(.system(size: 12)).foregroundStyle(Color("muted"))
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .containerBackground(Color("paper"), for: .widget)
      .widgetURL(URL(string: verse.url))
    }
  }
}

struct VerseWidget: Widget {
  let kind = "scriptune.verse"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: DailyProvider()) { entry in
      VerseWidgetView(entry: entry)
    }
    .configurationDisplayName("Verse of the day")
    .description("A Bible verse each day. Tap to read the passage.")
    .supportedFamilies([.systemMedium, .systemLarge, .accessoryRectangular])
  }
}

// A timeline that refreshes at the start of each day, so the verse changes daily.
struct DailyProvider: TimelineProvider {
  func placeholder(in context: Context) -> StaticEntry { StaticEntry(date: .now) }
  func getSnapshot(in context: Context, completion: @escaping (StaticEntry) -> Void) { completion(StaticEntry(date: .now)) }
  func getTimeline(in context: Context, completion: @escaping (Timeline<StaticEntry>) -> Void) {
    let tomorrow = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: Date())!)
    completion(Timeline(entries: [StaticEntry(date: .now)], policy: .after(tomorrow)))
  }
}
