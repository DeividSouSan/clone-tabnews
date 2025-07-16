import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "/infra/database.js";
import controller from "/infra/handlers.js";

const router = createRouter();

router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

const deafultMigrationOptions = {
  dir: join("infra", "migrations"),
  dryRun: true,
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(request, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const pedingMigrations = await migrationRunner({
      ...deafultMigrationOptions,
      dbClient: dbClient,
    });
    return response.status(200).json(pedingMigrations);
  } finally {
    await dbClient.end();
  }
}

async function postHandler(request, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...deafultMigrationOptions,
      dbClient: dbClient,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  } finally {
    await dbClient.end();
  }
}
