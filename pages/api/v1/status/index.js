import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/handlers.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const databaseVersionResult = await database
    .query("SHOW server_version;")
    .then((query) => query.rows[0].server_version);

  const databaseMaxConnectionsResult = await database
    .query("SHOW max_connections;")
    .then((query) => query.rows[0].max_connections);

  const databaseOpenedConnectionsResult = await database
    .query({
      text: "SELECT COUNT(*)::int as active_connections FROM pg_stat_activity WHERE datname = $1;",
      values: [process.env.POSTGRES_DB],
    })
    .then((query) => query.rows[0].active_connections);

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionResult,
        max_connections: parseInt(databaseMaxConnectionsResult),
        opened_connections: databaseOpenedConnectionsResult,
      },
    },
  });
}
