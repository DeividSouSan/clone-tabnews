const { exec } = require("node:child_process");

function checkPostgres() {
  exec(
    "docker exec postgres-dev pg_isready --host localhost",
    (error, stdout) => {
      if (stdout.search("accepting connections") === -1) {
        process.stdout.write(".");
        checkPostgres();
        return;
      }
      console.log("\n> 🟢 Postgres está aceitando conexões.\n");
    },
  );
}

console.log("> 🟡 Aguardando postgres aceitar conexões.");
checkPostgres();
