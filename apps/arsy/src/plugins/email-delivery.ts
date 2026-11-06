import type { FastifyInstance } from "fastify";

import type { EmailDeliveryProvider } from "../core/email/email-delivery.js";

declare module "fastify" {
  interface FastifyInstance {
    emailDelivery: EmailDeliveryProvider;
    publicAppUrl: string;
  }
}

export function registerEmailDelivery(
  app: FastifyInstance,
  provider: EmailDeliveryProvider,
  publicAppUrl: string,
): void {
  app.decorate("emailDelivery", provider);
  app.decorate("publicAppUrl", publicAppUrl);
  app.addHook("onClose", async () => {
    await provider.close?.();
  });
}
