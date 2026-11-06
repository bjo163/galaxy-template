import type { FastifyInstance } from "fastify";

export type ShutdownSignal = "SIGINT" | "SIGTERM";
export type SignalListener = () => void;

export type SignalSource = {
  on(signal: ShutdownSignal, listener: SignalListener): unknown;
  off(signal: ShutdownSignal, listener: SignalListener): unknown;
};

export type ServerRuntimeOptions = {
  host: string;
  port: number;
  shutdownTimeoutMs: number;
};

export type ServerLifecycle = {
  shutdown(): Promise<void>;
};

export async function startServer(
  app: FastifyInstance,
  options: ServerRuntimeOptions,
  signals: SignalSource = process,
): Promise<ServerLifecycle> {
  try {
    await app.listen({ host: options.host, port: options.port });
  } catch (error) {
    app.log.error({ err: error }, "failed to start server");

    try {
      await app.close();
    } catch (closeError) {
      app.log.error(
        { err: closeError },
        "failed to close server after startup error",
      );
    }

    throw error;
  }

  let shutdownPromise: Promise<void> | undefined;

  const shutdown = (): Promise<void> => {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    signals.off("SIGINT", onSigint);
    signals.off("SIGTERM", onSigterm);
    shutdownPromise = closeServer(app, options.shutdownTimeoutMs);

    return shutdownPromise;
  };

  const handleSignal = (signal: ShutdownSignal): void => {
    app.log.info({ signal }, "shutting down server");

    void shutdown().catch((error: unknown) => {
      app.log.error({ err: error }, "failed to shut down server");
      process.exitCode = 1;
    });
  };

  const onSigint = (): void => handleSignal("SIGINT");
  const onSigterm = (): void => handleSignal("SIGTERM");

  signals.on("SIGINT", onSigint);
  signals.on("SIGTERM", onSigterm);

  return { shutdown };
}

async function closeServer(
  app: FastifyInstance,
  timeoutMs: number,
): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const closePromise = app.close();
  const timeoutPromise = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), timeoutMs);
    timer.unref();
  });

  try {
    const result = await Promise.race([
      closePromise.then(() => "closed" as const),
      timeoutPromise,
    ]);

    if (result === "timeout") {
      app.log.error(
        { timeoutMs },
        "graceful shutdown timed out; closing active connections",
      );
      app.server.closeAllConnections();
      await closePromise;
    }
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
