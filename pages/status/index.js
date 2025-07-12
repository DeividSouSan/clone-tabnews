import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key); // URL relativa (utiliza o atual domínio no navegador)
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  console.log(fetchAPI("/api/v1/status"));
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseInfo />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updateAtText = "Carregando";

  if (!isLoading && data) {
    updateAtText = new Date(data.updated_at).toLocaleString("pt-br");
  }

  return <div>Última atualização: {updateAtText}</div>;
}

function DatabaseInfo() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let maxConnectionsText = "Carregando";
  let openedConnectionsText = "Carregando";
  let versionText = "Carregando";

  if (!isLoading && data) {
    const db = data.dependencies.database;
    maxConnectionsText = db.max_connections;
    openedConnectionsText = db.opened_connections;
    versionText = db.version;
  }

  return (
    <>
      <div>Número de Conexões Máximas: {maxConnectionsText}</div>
      <div>Número de Conexões Utilizadas: {openedConnectionsText}</div>
      <div>Versão do Banco de Dados: {versionText}</div>
    </>
  );
}
