import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Bookmark, BookmarkCheck } from "lucide-react-native";
import type { LibraryTargetType } from "@scriptune/contracts";
import { Button } from "@/components/ui";
import { library } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { keys } from "@/lib/query";

/** Save to the library. Guests are sent to sign in only when they press it. */
export function SaveButton({ type, targetKey }: { type: LibraryTargetType; targetKey: string }) {
  const isMember = useAuthStore((state) => state.status === "member");
  const queryClient = useQueryClient();
  const saved = useQuery({ queryKey: keys.saved(), queryFn: () => library.saved(), enabled: isMember, select: (data) => new Set(data.items.map((item) => `${item.target.type}:${item.target.key}`)) });
  const isSaved = saved.data?.has(`${type}:${targetKey}`) ?? false;
  const toggle = useMutation({
    mutationFn: async () => { if (isSaved) await library.unsave(type, targetKey); else await library.save(type, targetKey); },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.saved() }),
  });
  if (!isMember) return <Button label="Save" icon={Bookmark} variant="outline" onPress={() => router.push("/auth/login")} />;
  return <Button label={isSaved ? "Saved" : "Save"} icon={isSaved ? BookmarkCheck : Bookmark} variant={isSaved ? "primary" : "outline"} disabled={toggle.isPending} onPress={() => toggle.mutate()} />;
}
