import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";
import { decrypt } from "../../helpers/crypto.helper.ts";
import { generateEmbeddings, transcribeAudio } from "../../services/gemini.ts";

export const uploadAudioRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/rooms/:roomId/audio/:userId",
    {
      schema: {
        params: z.object({
          roomId: z.uuid(),
          userId: z.uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { roomId, userId } = request.params;

      const audio = await request.file();

      if (!audio) {
        throw new Error("Audio is required.");
      }

      const { key: userKey } = await db
        .select({ key: schema.users.key })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .then((rows) => rows[0]);

      if (!userKey) {
        throw new Error("User key is required.");
      }

      const rawKey = decrypt(userKey);

      const audioBuffer = await audio.toBuffer();
      const audioAsBase64 = audioBuffer.toString("base64");

      const transcription = await transcribeAudio(
        audioAsBase64,
        audio.mimetype,
        rawKey
      );
      const embeddings = await generateEmbeddings(transcription, rawKey);

      const result = await db
        .insert(schema.audioChunks)
        .values({
          roomId,
          transcription,
          embeddings,
        })
        .returning();

      const chunk = result[0];

      if (!chunk) {
        throw new Error("Erro ao salvar chunk de áudio");
      }

      return reply.status(201).send({ chunkId: chunk.id });
    }
  );
};
