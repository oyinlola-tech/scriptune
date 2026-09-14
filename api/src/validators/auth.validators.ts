import { z } from "@zudojs/validation";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(8).max(128);

export const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(80).optional(),
});

export const loginBodySchema = z.object({ email: emailSchema, password: passwordSchema });

export const refreshBodySchema = z.object({ refreshToken: z.string().min(20).max(4096) });

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(20).max(4096).optional(),
  everywhere: z.boolean().optional(),
});

/** Relative paths only, so the callback can never bounce a user off-site. */
export const redirectPathSchema = z
  .string()
  .trim()
  .max(512)
  // A single leading slash, then no backslash or encoded backslash anywhere:
  // browsers normalise "/\evil.com" and "/%5cevil.com" to a protocol-relative URL.
  .regex(/^\/(?![\/\\])(?!.*(?:\\|%5c|%5C)).*$/, "Redirect must be a same-site path.");

/** A custom-scheme deep link such as scriptune://auth/callback. Never http(s), so it can only open an app. */
export const customSchemeUrlSchema = z
  .string()
  .trim()
  .max(512)
  .regex(/^(?!https?:)[a-z][a-z0-9+.-]*:\/\/[^\s]+$/i, "Redirect must be a path or an app deep link.");

/** True when a redirect target is an app deep link rather than a web path. */
export function isCustomSchemeUrl(value: string): boolean {
  return customSchemeUrlSchema.safeParse(value).success;
}

export const googleStartQuerySchema = z.object({ redirect: z.union([redirectPathSchema, customSchemeUrlSchema]).optional() });

export const googleCallbackQuerySchema = z.object({
  code: z.string().min(1).max(2048).optional(),
  state: z.string().min(1).max(512).optional(),
  error: z.string().max(200).optional(),
});

export const googleExchangeBodySchema = z.object({ code: z.string().min(20).max(200) });
