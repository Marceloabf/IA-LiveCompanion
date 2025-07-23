import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod/v4";
import { db } from "../../db/connection.ts";
import { users } from "../../db/schema/user.ts";

export const loginRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/login",
    {
      schema: {
        body: z.object({
          email: z.email(),
          password: z.string().min(8),
        }),
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user.length === 0) {
        return reply
          .status(401)
          .send({ message: "Invalid email or password." });
      }

      const foundUser = user[0];

      //VERIFICAR COM O HASH
      if (foundUser.password !== password) {
        return reply
          .status(401)
          .send({ message: "Invalid email or password." });
      }

      // Return a success response with user details (excluding password)
      return reply.status(200).send({
        userId: foundUser.id,
        name: foundUser.name,
        role: foundUser.role,
        //TOKEN
      });
    }
  );
};
