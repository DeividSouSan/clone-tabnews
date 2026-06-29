import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import migrator from "models/migrator.js";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectUser)
  .get(controller.checkUserFeature("read:migrations"), getHandler)
  .post(controller.checkUserFeature("run:migrations"), postHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTrigger = request.context.user;

  const pendingMigrations = await migrator.listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTrigger,
    "read:migrations",
    pendingMigrations,
  );

  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const userTrigger = request.context.user;
  const migratedMigrations = await migrator.runPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTrigger,
    "read:migrations",
    migratedMigrations,
  );

  if (migratedMigrations.length > 0) {
    return response.status(201).json(secureOutputValues);
  }

  return response.status(200).json(secureOutputValues);
}
