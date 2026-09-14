import { Appearance } from "react-native";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { ListenWidget } from "./listen-widget";
import { SearchWidget } from "./search-widget";
import { VerseWidget } from "./verse-widget";

/**
 * Renders each home-screen widget when Android asks for it. Taps are handled
 * by the OPEN_URI actions on the widgets themselves, so nothing to do here
 * beyond drawing in the current appearance.
 */
export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps): Promise<void> {
  if (widgetAction === "WIDGET_DELETED" || widgetAction === "WIDGET_CLICK") return;
  const dark = Appearance.getColorScheme() === "dark";
  renderWidget(widgetInfo.widgetName === "Verse" ? <VerseWidget dark={dark} /> : widgetInfo.widgetName === "Search" ? <SearchWidget dark={dark} /> : <ListenWidget dark={dark} />);
}
