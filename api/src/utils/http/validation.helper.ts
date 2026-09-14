import { badRequest } from "@zudojs/http";
import { toFieldErrors, validate, type ValidationSchema } from "@zudojs/validation";

/**
 * Validates request input against a schema and converts failures into a
 * 400 response whose details map each field to its first problem.
 */
export function parseOrBadRequest<T>(
  schema: ValidationSchema<T>,
  value: unknown,
  subject: string = "request",
): T {
  const result = validate(schema, value);
  if (!result.success) {
    throw badRequest(`Invalid ${subject}.`, {
      code: "VALIDATION_FAILED",
      details: toFieldErrors(result.issues),
    });
  }
  return result.data;
}
