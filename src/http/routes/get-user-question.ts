import { desc, eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";

export const getUserQuestionsRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/questions/:userId",
    {
      schema: {
        params: z.object({
          userId: z.string(),
        }),
      },
    },
    async (request) => {
      const { userId } = request.params;

      const result = await db
        .select({
          id: schema.questions.id,
          question: schema.questions.question,
          answer: schema.questions.answer,
          createdAt: schema.questions.createdAt,
        })
        .from(schema.questions)
        .where(eq(schema.questions.userId, userId))
        .orderBy(desc(schema.questions.createdAt));

      return result;
    }
  );
};
