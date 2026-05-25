const { z } = require("zod");

const idAsString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => v.trim().length > 0, "id must be non-empty");

const hallId = z
  .union([z.number().int().positive(), z.string().regex(/^\d+$/)])
  .transform((v) => Number(v));

const baseAiEvent = z.object({
  confidence: z.number().min(0).max(1),
  exam_id: idAsString.optional(),
  hall_id: hallId.optional(),
  student_id: idAsString.optional(),
});

const aiAlertSchema = baseAiEvent.extend({
  event_id: z.string().uuid(),
  type: z.string().min(1),
  timestamp: z.string(),
  kind: z.literal("ai_alert").optional(),
});

const attendanceSchema = z.object({
  confidence: z.number().min(0).max(1),
  hall_id: hallId.optional(),
  exam_id: idAsString.optional(),
  student_id: idAsString,
});

const embeddingSchema = z.object({
  student_id: idAsString,
  embedding: z
    .array(z.number())
    .length(128)
    .refine(
      (arr) => arr.every((n) => Number.isFinite(n)),
      "embedding must be finite numbers"
    ),
});

module.exports = {
  aiAlertSchema,
  attendanceSchema,
  embeddingSchema,
};