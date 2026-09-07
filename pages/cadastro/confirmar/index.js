import { Banner } from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";

export default function ConfirmRegisterPage() {
  return (
    <DefaultLayout>
      <Banner
        title="Falta apenas uma etapa!"
        description="Ative sua conta através do email enviado pelo FinTab."
        variant="warning"
      />
    </DefaultLayout>
  );
}
