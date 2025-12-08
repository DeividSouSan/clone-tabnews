import email from "infra/email";
import dedent from "dedent";

async function sendEmailToUser(user) {
  await email.send({
    to: user.email,
    subject: "Ative sua conta no FinTab!",
    text: dedent`${user.username}, clique no link abaixo para ativar seu email!
    
    https://example.com

    Atenciosamente,
    Equipe FinTab
    `,
  });
}

const activation = {
  sendEmailToUser,
};

export default activation;
