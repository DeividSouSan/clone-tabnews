import { useState } from "react";
import { Button, FormControl, Heading, Stack, TextInput } from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";

export default function RegisterPage() {
  return (
    <DefaultLayout
      contentWidth="small"
      metadata={{
        title: "Cadastro",
        description: "Faça seu cadastro de forma gratuita.",
      }}
    >
      <Heading as="h1">Cadastro</Heading>
      <RegisterForm />
    </DefaultLayout>
  );
}

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const requestBody = { username, email, password };

    const response = await fetch("/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 201) {
      location.href = "/cadastro/confirmar";
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={"spacious"}>
        <FormControl>
          <FormControl.Label>Nome de usuário</FormControl.Label>
          <TextInput
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            block
          />
        </FormControl>
        <FormControl>
          <FormControl.Label>Email</FormControl.Label>
          <TextInput
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            block
          />
        </FormControl>
        <FormControl>
          <FormControl.Label>Senha</FormControl.Label>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            block
          />
        </FormControl>

        <Stack.Item>
          <Button type="submit" variant="primary">
            Criar cadastro
          </Button>
        </Stack.Item>
      </Stack>
    </form>
  );
}
