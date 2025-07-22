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
    rooms: {
      count: 5,
      columns: {
        name: f.companyName(),
        description: f.loremIpsum(),
      },
    },
    questions: {
      count: 20,
    },
  };
});

await sql.end();

// biome-ignore lint/suspicious/noConsole: only used in dev
console.log("Database seeded");
