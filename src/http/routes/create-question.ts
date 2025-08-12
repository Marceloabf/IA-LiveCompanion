import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";
import { decrypt } from "../../helpers/crypto.helper.ts";
import { generateAnswer, generateEmbeddings } from "../../services/gemini.ts";

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/rooms/:roomId/questions",
    {
      schema: {
        params: z.object({
          roomId: z.string(),
        }),
        body: z.object({
          question: z.string().min(1),
          userId: z.uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { roomId } = request.params;
      const { question, userId } = request.body;

      const { key: userKey } = await db
        .select({ key: schema.users.key })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .then((rows) => rows[0]);

      if (!userKey) {
        throw new Error("User key is required.");
      }

      const rawKey = decrypt(userKey);

      const embeddings = await generateEmbeddings(question, rawKey);

      const embeddingsAsString = `[${embeddings.join(",")}]`;

      const chunks = await db
        .select({
          id: schema.audioChunks.id,
          transcription: schema.audioChunks.transcription,
          similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector)`,
        })
        .from(schema.audioChunks)
        .where(
          and(
            eq(schema.audioChunks.roomId, roomId),
            sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector) > 0.7`
          )
        )
        .orderBy(
          sql`${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector`
        )
        .limit(3);

      let answer: string | null = null;

      if (chunks.length > 0) {
        const transcriptions = chunks.map((chunk) => chunk.transcription);

        answer = await generateAnswer(question, transcriptions);
      }

      const result = await db
        .insert(schema.questions)
        .values({ roomId, question, answer, userId })
        .returning();

      const insertedQuestion = result[0];

      if (!insertedQuestion) {
        throw new Error("Failed to create new room.");
      }

      return reply.status(201).send({
        questionId: insertedQuestion.id,
        answer,
      });
    }
  );
};
