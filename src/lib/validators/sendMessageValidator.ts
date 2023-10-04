import * as z from "zod";

export const SendMessageValidator = z.object({
    fileId: z.string(),
    message: z.string()
});

export type SendMessageRequest = z.infer<typeof SendMessageValidator>;
