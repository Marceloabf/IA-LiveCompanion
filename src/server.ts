import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { fastify } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "./env.ts";
import { createQuestionRoute } from "./http/routes/create-question.ts";
import { createRoomRoute } from "./http/routes/create-rooms.ts";
import { createUserRoute } from "./http/routes/create-user.ts";
import { getRoomQuestionsRoute } from "./http/routes/get-room-questions.ts";
import { getRoomsRoute } from "./http/routes/get-rooms.ts";
import { loginRoute } from "./http/routes/login.ts";
import { uploadAudioRoute } from "./http/routes/upload-audio.ts";
import { verifyToken } from "./middlewares/verifyToken.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: "http://localhost:5173",
});

app.register(fastifyMultipart);

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.get("/health", () => {
  return { status: "ok" };
});

app.addHook("onRequest", async (request, reply) => {
  const publicRoutes = ["/login", "/register", "/health"];
  if (publicRoutes.includes(request.url)) {
    return;
  }
  await verifyToken(request, reply);
});

app.register(getRoomsRoute);
app.register(getRoomQuestionsRoute);
app.register(createUserRoute);
app.register(createRoomRoute);
app.register(createQuestionRoute);
app.register(uploadAudioRoute);
app.register(loginRoute);

app.listen({ port: env.PORT });
