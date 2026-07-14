import * as z from 'zod';

export const createMessageSchema = z.object({
  // Define fields
  name: z.string(),
});

export const MessageSchemaValidation = {
createMessageSchema
};
  