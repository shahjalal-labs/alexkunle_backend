import * as z from 'zod';

export const createProductSchema = z.object({
  // Define fields
  name: z.string(),
});

export const ProductSchemaValidation = {
createProductSchema
};
  