import { createApiClient } from "@scriptune/contracts";
import { getApiUrl, useApiConfig } from "../config";

/** The one API client for the app. The auth store registers its token source on start. */
export const client = createApiClient({ baseUrl: getApiUrl() });

export const api = client.request;

// Follow the device's chosen address as soon as it is read from storage or changed.
useApiConfig.subscribe(() => client.setBaseUrl(getApiUrl()));
useApiConfig.persist.onFinishHydration(() => client.setBaseUrl(getApiUrl()));
