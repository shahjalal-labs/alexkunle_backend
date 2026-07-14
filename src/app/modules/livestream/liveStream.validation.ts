import * as z from 'zod';

export const createLiveStreamSchema = z.object({
  // Define fields
  name: z.string(),
});

export const LiveStreamSchemaValidation = {
createLiveStreamSchema
};
  