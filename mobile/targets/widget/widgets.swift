import SwiftUI
import WidgetKit

// MARK: - Timeline (static: nothing changes over time)

struct StaticEntry: TimelineEntry {
  let date: Date
}

struct StaticProvider: TimelineProvider {
  func placeholder(in context: Context) -> StaticEntry { StaticEntry(date: .now) }
  func getSnapshot(in context: Context, completion: @escaping (StaticEntry) -> Void) { completion(StaticEntry(date: .now)) }
  func getTimeline(in context: Context, completion: @escaping (Timeline<StaticEntry>) -> Void) {
    completion(Timeline(entries: [StaticEntry(date: .now)], policy: .never))
  }
}

// MARK: - Listen: the ink disc in a dashed gold dial, like the app's own button

struct ListenDisc: View {
  var size: CGFloat
  var body: some View {
    ZStack {
      Circle()
        .strokeBorder(style: StrokeStyle(lineWidth: size * 0.035, dash: [size * 0.02, size * 0.05]))
        .foregroundStyle(Color("gold"))
      Circle()
        .fill(Color("ink"))
        .padding(size * 0.14)
      Image(systemName: "mic.fill")
        .font(.system(size: size * 0.3, weight: .regular))
        .foregroundStyle(Color("ivory"))
    }
    .frame(width: size, height: size)
  }
}

struct ListenWidgetView: View {
  @Environment(\.widgetFamily) private var family
  var entry: StaticEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      Image(systemName: "mic.fill")
        .font(.system(size: 22, weight: .medium))
        .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        .widgetURL(URL(string: "scriptune://listen"))
    default:
      VStack(spacing: 8) {
        ListenDisc(size: 84)
        Text("Listen")
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(Color("text"))
        Text("Hymn or verse")
          .font(.system(size: 11))
          .foregroundStyle(Color("muted"))
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .containerBackground(Color("paper"), for: .widget)
      .widgetURL(URL(string: "scriptune://listen"))
    }
  }
}

struct ListenWidget: Widget {
  let kind = "scriptune.listen"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: StaticProvider()) { entry in
      ListenWidgetView(entry: entry)
    }
    .configurationDisplayName("Listen")
    .description("Tap to identify the hymn or verse playing around you.")
    .supportedFamilies([.systemSmall, .accessoryCircular])
  }
}

// MARK: - Search: a quiet search bar that opens the Search tab

struct SearchWidgetView: View {
  var entry: StaticEntry
  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text("SCRIPTUNE")
        .font(.system(size: 10, weight: .semibold))
        .tracking(2)
        .foregroundStyle(Color("gold"))
      HStack(spacing: 10) {
        Image(systemName: "magnifyingglass")
          .foregroundStyle(Color("muted"))
        Text("Search hymns and verses")
          .font(.system(size: 15))
          .foregroundStyle(Color("muted"))
        Spacer()
      }
      .padding(.horizontal, 14)
      .padding(.vertical, 12)
      .background(Color("paper").opacity(0.001))
      .overlay(RoundedRectangle(cornerRadius: 999).strokeBorder(Color("muted").opacity(0.35)))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .containerBackground(Color("paper"), for: .widget)
    .widgetURL(URL(string: "scriptune://search"))
  }
}

struct SearchWidget: Widget {
  let kind = "scriptune.search"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: StaticProvider()) { entry in
      SearchWidgetView(entry: entry)
    }
    .configurationDisplayName("Search")
    .description("Jump straight to searching hymns and verses.")
    .supportedFamilies([.systemMedium])
  }
}

#Preview(as: .systemSmall) { ListenWidget() } timeline: { StaticEntry(date: .now) }
#Preview(as: .systemMedium) { SearchWidget() } timeline: { StaticEntry(date: .now) }
