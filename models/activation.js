import email from "infra/email";
import dedent from "dedent";
import database from "infra/database";
import webserver from "infra/webserver";
import { ForbiddenError, NotFoundError } from "infra/errors";
import user from "./user";
import authorization from "./authorization";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function activateUserById(userId) {
  const targetUser = await user.findOneById(userId);

  const isAuthorized = authorization.check(targetUser, "read:activation_token");

  if (!isAuthorized) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
    "update:user",
  ]);
  return activatedUser;
}

async function createToken(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING 
          *
      ;`,

      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function findTokenById(tokenId) {
  const tokenObject = await runSelectQuery(tokenId);
  return tokenObject;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          user_activation_tokens
        WHERE
          id = $1 
          AND used IS NULL 
          AND expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }
    return results.rows[0];
  }
}

async function markTokenAsUsed(tokenId) {
  const usedToken = await runUpdateQuery(tokenId);
  return usedToken;

  async function runUpdateQuery(tokenId) {
    const results = await database.query({
      text: `
        UPDATE 
          user_activation_tokens
        SET
          used = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [tokenId],
    });

    return results.rows[0];
  }
}
async function sendEmailToUser(user, token) {
  await email.send({
    to: user.email,
    subject: "Ative sua conta no FinTab!",
    text: dedent`${user.username}, clique no link abaixo para ativar seu email!
    
    ${webserver.origin}/cadastro/ativar/${token.id}

    Atenciosamente,
    Equipe FinTab
    `,
  });
}

const activation = {
  activateUserById,
  createToken,
  findTokenById,
  markTokenAsUsed,
  sendEmailToUser,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
