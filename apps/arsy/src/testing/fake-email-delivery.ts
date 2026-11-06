import type {
  EmailDeliveryProvider,
  EmailMessage,
} from "../core/email/email-delivery.js";

export class CapturingEmailDelivery implements EmailDeliveryProvider {
  readonly messages: EmailMessage[] = [];
  failure: Error | null = null;

  async send(message: EmailMessage): Promise<void> {
    this.messages.push(message);
    if (this.failure) {
      throw this.failure;
    }
  }

  tokenFor(action: string): string {
    for (const message of [...this.messages].reverse()) {
      const link = message.text.match(/https?:\/\/\S+/)?.[0];
      if (!link) {
        continue;
      }

      const url = new URL(link);
      if (url.searchParams.get("action") === action) {
        const token = url.searchParams.get("token");
        if (token) {
          return token;
        }
      }
    }

    throw new Error(`No email token was sent for ${action}.`);
  }
}
