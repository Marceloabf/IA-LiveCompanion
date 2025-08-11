import { count, eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";

export const getRoomsRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/rooms/:userId",
    {
      schema: {
        params: z.object({
          userId: z.uuid(),
        }),
      },
    },
    async (request) => {
      const { userId } = request.params;

      const results = await db
        .select({
          id: schema.rooms.id,
          name: schema.rooms.name,
          createdAt: schema.rooms.createdAt,
          questionsCount: count(schema.questions.id),
        })
        .from(schema.rooms)
        .leftJoin(
          schema.questions,
          eq(schema.questions.roomId, schema.rooms.id)
        )
        .where(eq(schema.rooms.userId, userId))
        .groupBy(schema.rooms.id)
        .orderBy(schema.rooms.createdAt);

      return results;
    }
  );
};
