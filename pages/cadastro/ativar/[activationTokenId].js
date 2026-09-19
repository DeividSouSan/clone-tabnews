import { Banner } from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ActivateUserPage() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const activationToken = router.query.activationTokenId;

  useEffect(() => {
    if (!activationToken) return;

    sendActivationRequest();

    async function sendActivationRequest() {
      try {
        const response = await fetch(`/api/v1/activations/${activationToken}`, {
          method: "PATCH",
        });

        let responseBody = await response.json();

        if (response.ok) setStatus("success");
        else {
          setStatus("failure");
          setErrorMessage(`${responseBody.message}  ${responseBody.action}`);
        }
      } catch {
        setErrorMessage(
          "Houve uma falha na conexão com o servidor. Tente novamente mais tarde.",
        );
        setStatus("failure");
      }
    }
  }, [activationToken]);

  return (
    <DefaultLayout
      contentWidth="small"
      metadata={{
        title: "Ativar Cadastro",
      }}
    >
      {status === "loading" && (
        <Banner variant="info" layout="compact">
          <Banner.Title>Ativando...</Banner.Title>
        </Banner>
      )}

      {status === "success" && (
        <Banner variant="success" layout="compact">
          <Banner.Title>Conta ativada com sucesso! 🎉 </Banner.Title>
          <Banner.Description>
            Sua conta foi efetivamente ativada e já é possível fazer{" "}
            <a href="/login">login</a>.
          </Banner.Description>
        </Banner>
      )}

      {status === "failure" && (
        <Banner variant="critical" layout="compact">
          <Banner.Title>Houve um problema ao ativar a conta! 😔</Banner.Title>
          <Banner.Description>
            {errorMessage ??
              "Houve um problema ao ativar sua conta, sentimos muito."}
          </Banner.Description>
        </Banner>
      )}
    </DefaultLayout>
  );
}
