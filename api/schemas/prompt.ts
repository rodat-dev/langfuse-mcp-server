import { z } from "zod";

/*
 * ────────────────────────────────────────────────────────────────────────────────
 * Prompt management – Zod schemas
 *
 * These schemas mirror the portions of the Langfuse public API that deal with
 * prompt management (/api/public/v2/prompts …). They can be used to validate
 * outgoing requests as well as incoming responses.
 * ────────────────────────────────────────────────────────────────────────────────
 */

/* -------------------------------------------------------------------------- */
/* Utility                                                                     */
/* -------------------------------------------------------------------------- */

export const UtilsMetaResponseSchema = z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
});

/* -------------------------------------------------------------------------- */
/* Core building blocks                                                        */
/* -------------------------------------------------------------------------- */

export const ChatMessageSchema = z.object({
    role: z.string(),
    content: z.string(),
});

/* -------------------------------------------------------------------------- */
/* Create-prompt request                                                       */
/* -------------------------------------------------------------------------- */

export const CreateChatPromptRequestSchema = z.object({
    type: z.literal("chat"),
    name: z.string(),
    prompt: z.array(ChatMessageSchema),
    config: z.any().nullable().optional(),
    labels: z.array(z.string()).nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    commitMessage: z.string().nullable().optional(),
});

export const CreateTextPromptRequestSchema = z.object({
    type: z.literal("text"),
    name: z.string(),
    prompt: z.string(),
    config: z.any().nullable().optional(),
    labels: z.array(z.string()).nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    commitMessage: z.string().nullable().optional(),
});

export const CreatePromptRequestSchema = z.union([
    CreateChatPromptRequestSchema,
    CreateTextPromptRequestSchema,
]);

/* -------------------------------------------------------------------------- */
/* Prompt resource (response)                                                  */
/* -------------------------------------------------------------------------- */

const BasePromptSchema = z.object({
    name: z.string(),
    version: z.number(),
    config: z.any(),
    labels: z.array(z.string()),
    tags: z.array(z.string()),
    commitMessage: z.string().nullable().optional(),
    resolutionGraph: z.record(z.any()).nullable().optional(),
});

export const TextPromptSchema = BasePromptSchema.extend({
    type: z.literal("text"),
    prompt: z.string(),
});

export const ChatPromptSchema = BasePromptSchema.extend({
    type: z.literal("chat"),
    prompt: z.array(ChatMessageSchema),
});

export const PromptSchema = z.union([ChatPromptSchema, TextPromptSchema]);

/* -------------------------------------------------------------------------- */
/* Prompt meta list (response of GET /prompts)                                 */
/* -------------------------------------------------------------------------- */

export const PromptMetaSchema = z.object({
    name: z.string(),
    versions: z.array(z.number()),
    labels: z.array(z.string()),
    tags: z.array(z.string()),
    lastUpdatedAt: z.string(),
    // The OpenAPI spec marks `lastConfig` as `any`, we keep the same flexibility.
    lastConfig: z.any(),
});

export const PromptMetaListResponseSchema = z.object({
    data: z.array(PromptMetaSchema),
    meta: UtilsMetaResponseSchema,
});

/* -------------------------------------------------------------------------- */
/* Update-prompt-version request (PATCH /prompts/{name}/versions/{version})    */
/* -------------------------------------------------------------------------- */

export const UpdatePromptVersionRequestSchema = z.object({
    newLabels: z.array(z.string()),
});

/* -------------------------------------------------------------------------- */
/* Query-parameter helpers                                                     */
/* -------------------------------------------------------------------------- */

export const ListPromptsQuerySchema = z.object({
    name: z.string().optional(),
    label: z.string().optional(),
    tag: z.string().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    fromUpdatedAt: z.string().optional(), // ISO8601 date-time string
    toUpdatedAt: z.string().optional(),
});

export const GetPromptQuerySchema = z.object({
    version: z.number().optional(),
    label: z.string().optional(),
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
export type CreatePromptRequest = z.infer<typeof CreatePromptRequestSchema>;
export type PromptMeta = z.infer<typeof PromptMetaSchema>;
export type PromptMetaListResponse = z.infer<typeof PromptMetaListResponseSchema>;
export type UpdatePromptVersionRequest = z.infer<typeof UpdatePromptVersionRequestSchema>; 