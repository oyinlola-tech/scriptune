// Web build: no keychain, so the browser's own storage keeps the session, as the web app does.
const storage = () => (typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage);

export const secrets = {
  get: async (key: string): Promise<string | null> => { try { return storage()?.getItem(key) ?? null; } catch { return null; } },
  set: async (key: string, value: string): Promise<void> => { try { storage()?.setItem(key, value); } catch { /* private mode or blocked storage */ } },
  delete: async (key: string): Promise<void> => { try { storage()?.removeItem(key); } catch { /* ignore */ } },
};
