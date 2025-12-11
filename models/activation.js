import email from "infra/email";
import dedent from "dedent";
import database from "infra/database";
import webserver from "infra/webserver";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

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

async function findOneById(userId) {
  const tokenId = await runSelectQuery();
  return tokenId;

  async function runSelectQuery() {
    const results = await database.query({
      text: `
      SELECT 
        id 
      FROM 
        user_activation_tokens
      WHERE
        user_id = $1 
      LIMIT
        1
      ;`,
      values: [userId],
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
  createToken,
  findOneById,
  sendEmailToUser,
};

export default activation;
