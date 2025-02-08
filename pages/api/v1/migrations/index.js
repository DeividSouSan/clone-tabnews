import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "/infra/database";

export default async function migrations(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return response.status(405).json({
      error: `Method ${request.method} Not Allowed.`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const deafultMigrationOptions = {
      dbClient: dbClient,
      dir: join("infra", "migrations"),
      dryRun: true,
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    if (request.method === "GET") {
      const pedingMigrations = await migrationRunner(deafultMigrationOptions);
      return response.status(200).json(pedingMigrations);
    }

    if (request.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...deafultMigrationOptions,
        dryRun: false,
      });

      if (migratedMigrations.length > 0) {
        return response.status(201).json(migratedMigrations);
      }

      return response.status(200).json(migratedMigrations);
    }
  } catch (err) {
    console.error(err);
    return response.status(500).json({
      error: "Internal Server Error.",
    });
  } finally {
    await dbClient.end();
  }
}
