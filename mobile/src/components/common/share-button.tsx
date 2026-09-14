import { Share2 } from "lucide-react-native";
import { Share } from "react-native";
import { Button } from "@/components/ui";
import { SITE_URL } from "@/lib/config";

/** Opens the system share sheet with a link to the same page on the web. */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const url = `${SITE_URL}${path}`;
  return <Button label="Share" icon={Share2} variant="outline" onPress={() => void Share.share({ title, message: `${title} ${url}`, url }).catch(() => undefined)} />;
}
