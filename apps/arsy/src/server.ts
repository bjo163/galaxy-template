import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { registerConsole } from "./frontend/register-console.js";
import { startServer } from "./runtime/server-lifecycle.js";

const config = loadConfig();
const app = createApp(config);

try {
  await registerConsole(app, config.nodeEnv === "development");
  await startServer(app, {
    host: config.host,
    port: config.port,
    shutdownTimeoutMs: config.shutdownTimeoutMs,
  });
} catch (error) {
  app.log.fatal({ err: error }, "failed to initialize server");
  process.exitCode = 1;
  await app.close();
}
