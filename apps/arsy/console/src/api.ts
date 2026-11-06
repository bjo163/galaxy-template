export class ArsyApi {
  private accessToken: string | null = null;
  private workspaceId: string | null = null;
  private projectId: string | null = null;

  setAccessToken(accessToken: string | null): void {
    this.accessToken = accessToken;
  }

  setProjectContext(workspaceId: string | null, projectId: string | null): void {
    this.workspaceId = workspaceId;
    this.projectId = projectId;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }
    if (this.workspaceId) {
      headers.set("X-Arsy-Workspace-Id", this.workspaceId);
    }
    if (this.projectId) {
      headers.set("X-Arsy-Project-Id", this.projectId);
    }

    if (init.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`/api/v1${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
    const responseText = await response.text();
    let responseBody: unknown;

    if (responseText) {
      try {
        responseBody = JSON.parse(responseText) as unknown;
      } catch {
        throw new Error(
          `Arsy returned an invalid response (HTTP ${response.status}).`,
        );
      }
    }

    if (!response.ok) {
      const detail =
        typeof responseBody === "object" &&
        responseBody !== null &&
        "detail" in responseBody &&
        typeof responseBody.detail === "string"
          ? responseBody.detail
          : `The request failed (HTTP ${response.status}).`;

      throw new Error(detail);
    }

    return responseBody as T;
  }
}

export const arsyApi = new ArsyApi();
