import { createTransport } from "nodemailer";

import type { SmtpConfig } from "../../config/env.js";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export interface EmailDeliveryProvider {
  send(message: EmailMessage): Promise<void>;
  close?(): void | Promise<void>;
}

export class EmailDeliveryUnavailableError extends Error {
  readonly statusCode = 503;

  constructor() {
    super("Email delivery is temporarily unavailable.");
    this.name = "EmailDeliveryUnavailableError";
  }
}

export function createEmailActionUrl(
  publicAppUrl: string,
  action: "verify-email" | "reset-password" | "accept-invitation",
  token: string,
): string {
  const url = new URL("/", publicAppUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("token", token);
  return url.toString();
}

export function createSmtpEmailDelivery(
  config: SmtpConfig | null,
): EmailDeliveryProvider {
  if (!config) {
    return {
      async send() {
        throw new EmailDeliveryUnavailableError();
      },
    };
  }

  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.user && config.password
      ? { auth: { user: config.user, pass: config.password } }
      : {}),
  });

  return {
    async send(message) {
      try {
        await transport.sendMail({
          from: config.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
        });
      } catch {
        throw new EmailDeliveryUnavailableError();
      }
    },
    close() {
      transport.close();
    },
  };
}
