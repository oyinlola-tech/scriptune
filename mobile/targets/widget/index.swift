import SwiftUI
import WidgetKit

/// Every Scriptune widget. Widgets cannot use the microphone themselves;
/// each one opens the app with a deep link that starts the right action.
@main
struct ScriptuneWidgets: WidgetBundle {
  var body: some Widget {
    ListenWidget()
    SearchWidget()
    VerseWidget()
  }
}
