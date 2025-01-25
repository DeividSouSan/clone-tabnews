import migrationRunner from 'node-pg-migrate';
import { join } from "node:path";
import database from "/infra/database";

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();

  const deafultMigrationOptions = {
    dbClient: dbClient,
    dir: join('infra', 'migrations'),
    dryRun: true,
    direction: 'up',
    verbose: true,
    migrationsTable: 'pgmigrations',
  };

  if (request.method === "GET") {
    const pedingMigrations = await migrationRunner(deafultMigrationOptions);

    await dbClient.end();

    return response.status(200).json(pedingMigrations);
  }

  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...deafultMigrationOptions,
      dryRun: false,
    })

    await dbClient.end();

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  }

  response.status(405).end();
}