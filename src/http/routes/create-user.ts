import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";
import { users } from "../../db/schema/user.ts";
import { encrypt } from "../../helpers/crypto.helper.ts";

export const createUserRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/users",
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          email: z.email(),
          password: z.string().min(8),
          key: z.string().min(20).optional(),
          role: z.enum(["user", "teacher"]).default("user"),
        }),
      },
    },
    async (request, reply) => {
      const { name, email, key, role, password } = request.body;

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return reply.status(409).send({ message: "User already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      let encryptedKey = "";
      if (key) {
        encryptedKey = encrypt(key);
      }

      const result = await db
        .insert(schema.users)
        .values({
          name,
          email,
          password: hashedPassword,
          key: encryptedKey || undefined,
          role,
        })
        .returning();

      const insertedUser = result[0];

      if (!insertedUser) {
        throw new Error("Failed to create new user.");
      }

      return reply.status(201).send({ userId: insertedUser.id });
    }
  );
};
