import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import user from "models/user.js";
import activation from "models/activation.js";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectUser)
  .post(controller.checkUserFeature("create:user"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userTrigger = request.context.user;
  const userData = request.body;

  const userNew = await user.create(userData);

  const activationToken = await activation.createToken(userNew.id);
  await activation.sendEmailToUser(userNew, activationToken);

  const secureOutputValues = authorization.filterOutput(
    userTrigger,
    "read:user",
    userNew,
  );

  return response.status(201).json(secureOutputValues);
}
