import { reset, seed } from "drizzle-seed";
import { db, sql } from "./connection.ts";
import { schema } from "./schema/index.ts";
import { questions } from "./schema/questions.ts";
import { rooms } from "./schema/rooms.ts";
import { users } from "./schema/user.ts";

await reset(db, schema);

export const seedSchema = {
  rooms,
  questions,
  users,
};

await seed(db, seedSchema).refine((f) => {
  return {
    users: {
      count: 5,
      columns: {
        name: f.fullName(),
        email: f.email(),
        password: f.default({ defaultValue: "12345678" }),
        key: f.uuid(),
        role: f.valuesFromArray({ values: ["user", "teacher"] }),
      },
    },
    rooms: {
      count: 5,
      columns: {
        name: f.companyName(),
        description: f.loremIpsum(),
      },
      userId: f.uuid(),
    },
    questions: {
      count: 20,
      userId: f.uuid(),
      roomId: f.uuid(),
    },
  };
});

await sql.end();

// biome-ignore lint/suspicious/noConsole: <teste para seed antes de logs estruturados>
console.log("Database seeded");
