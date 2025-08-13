import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import jwt from "jsonwebtoken";
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
      const passwordMatch = await bcrypt.compare(password, foundUser.password);

      if (!passwordMatch) {
        return reply
          .status(401)
          .send({ message: "Invalid email or password." });
      }

      const JWT_SECRET = process.env.JWT_SECRET;

      if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
      }

      const token = jwt.sign(
        { userId: foundUser.id, role: foundUser.role },
        JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      return reply.status(200).send({
        userId: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        token,
      });
    }
  );
};
