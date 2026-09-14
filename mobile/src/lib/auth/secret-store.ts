import * as SecureStore from "expo-secure-store";

/** Small secrets (the refresh token, the pending sign-in marker) in the device keychain. */
export const secrets = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  delete: (key: string) => SecureStore.deleteItemAsync(key),
};
