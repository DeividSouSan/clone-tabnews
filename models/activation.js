import email from "infra/email";
import dedent from "dedent";
import database from "infra/database";
import webserver from "infra/webserver";
import { NotFoundError } from "infra/errors";
import user from "./user";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function activateUserById(userId) {
  const activatedUser = user.setFeatures(userId, [
    "create:session",
    "read:session",
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

async function findValidTokenById(tokenId) {
  const tokenObject = await runSelectQuery();
  return tokenObject;

  async function runSelectQuery() {
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
      throw NotFoundError({
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
  findValidTokenById,
  markTokenAsUsed,
  sendEmailToUser,
};

export default activation;
