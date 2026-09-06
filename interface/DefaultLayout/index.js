import Head from "next/head";
import { Header, PageLayout, Text } from "@primer/react";

export default function DefaultLayout({ children, metadata = {} }) {
  return (
    <>
      <Head>
        <title>
          {metadata.title ? `${metadata.title} ⟡ FinTab` : "FinTab"}
        </title>
      </Head>

      {metadata.description && (
        <meta name="description" content={metadata.description} />
      )}
      <Header>
        <Header.Item full>
          <Header.Link href="/">FinTab</Header.Link>
        </Header.Item>
        <Header.Item>
          <Header.Link href="/login">Login</Header.Link>
        </Header.Item>
        <Header.Item>
          <Header.Link href="/cadastro">Cadastrar</Header.Link>
        </Header.Item>
      </Header>

      <PageLayout>
        <PageLayout.Content>{children}</PageLayout.Content>
        <PageLayout.Footer divider="line">
          <Text size="small" as="p" align="center">
            © {new Date().getFullYear()} FinTab
          </Text>
        </PageLayout.Footer>
      </PageLayout>
    </>
  );
}
