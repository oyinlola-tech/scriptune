# @scriptune/contracts

Shared contracts for the Scriptune clients (`web/` and `mobile/`).

- `types.ts`: response shapes of the API, mirrored from `api/src/dtos`.
- `keys.ts`: `verseKey`, `parseVerseKey` and `targetPath` for library targets.
- `client.ts`: `createApiClient({ baseUrl, tokenSource })`, which attaches the bearer token, retries once after a refresh on 401 and throws `ApiError`.

The package ships TypeScript source (no build step). Consumers reference it with `"@scriptune/contracts": "file:../packages/contracts"`; Next.js transpiles it through `transpilePackages`, Metro transpiles it natively.

When a DTO changes in `api/src/dtos`, update `types.ts` here. Both clients typecheck against it.
