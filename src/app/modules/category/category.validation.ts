import * as z from 'zod';

export const createCategorySchema = z.object({
  // Define fields
  name: z.string(),
});

export const CategorySchemaValidation = {
createCategorySchema
};
  