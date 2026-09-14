import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetworkState } from "expo-network";
import { listCorpora } from "./database";

export const corporaKey = ["offline", "corpora"] as const;

/** True unless the device reports it has no route to the internet. */
export function useIsOnline(): boolean {
  const state = useNetworkState();
  return state.isInternetReachable ?? state.isConnected ?? true;
}

/** Which corpora are on the device, refreshed after every download or removal. */
export function useCorpora() {
  const query = useQuery({ queryKey: corporaKey, queryFn: listCorpora, staleTime: Infinity });
  const corpora = query.data ?? [];
  return {
    corpora,
    isLoaded: query.isSuccess,
    hasBible: corpora.some((corpus) => corpus.kind === "bible"),
    hasHymnal: corpora.some((corpus) => corpus.kind === "hymnal"),
    hasAny: corpora.length > 0,
  };
}

export function useInvalidateCorpora() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: corporaKey });
}

