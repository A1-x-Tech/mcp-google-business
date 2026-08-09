import { ConfigError, loadConfig } from "./config.js";
import { GoogleBusinessClient } from "./client.js";

/** Live READ-ONLY smoke check: lists the accessible Business Profile accounts. */
async function main(): Promise<void> {
  const client = new GoogleBusinessClient(loadConfig());
  const result = await client.listAccounts({ pageSize: 5 });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  // Missing credentials are a user error, not a bug: report without the stack.
  console.error("smoke failed:", err instanceof ConfigError ? err.message : err);
  process.exit(1);
});
