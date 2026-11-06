import "./styles.css";

import { arsyApi } from "./api";
import { renderConsoleApp, type AuthMode, type ConsoleSection, type ConsoleViewState } from "./view";
import type {
  Account,
  Addon,
  ApiList,
  AuthResponse,
  Model,
  Project,
  Workspace,
} from "./types";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("The Arsy console root element is missing.");
}

const consoleRoot = root;

const state: ConsoleViewState = {
  account: null,
  authMode: "login",
  emailActionToken: null,
  workspaces: [],
  workspaceId: "",
  projects: [],
  projectId: "",
  models: [],
  addons: [],
  section: "overview",
  busy: false,
  loading: false,
  error: null,
  notice: null,
};

let pendingInvitationToken = localStorage.getItem(
  "arsy-pending-invitation-token",
);

const savedTheme = localStorage.getItem("arsy-console-theme");
document.documentElement.dataset.theme =
  savedTheme === "dark" ? "dark" : "light";

function render(): void {
  renderConsoleApp(consoleRoot, state);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Permintaan tidak dapat diselesaikan.";
}

function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string") {
    throw new Error(`Kolom ${key} wajib diisi.`);
  }

  return value;
}

function parseJsonObject(value: string, label: string): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    throw new Error(`${label} harus berisi JSON yang valid.`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} harus berupa object JSON.`);
  }

  return parsed as Record<string, unknown>;
}

function projectPath(): string {
  if (!state.workspaceId || !state.projectId) {
    throw new Error("Pilih workspace dan project terlebih dahulu.");
  }

  return `/workspaces/${encodeURIComponent(state.workspaceId)}/projects/${encodeURIComponent(state.projectId)}`;
}

async function loadProjectData(): Promise<void> {
  if (!state.workspaceId || !state.projectId) {
    state.models = [];
    state.addons = [];
    return;
  }

  state.loading = true;
  render();

  try {
    const rootPath = projectPath();
    const [models, addons] = await Promise.all([
      arsyApi.request<ApiList<Model>>(`${rootPath}/models`),
      arsyApi.request<ApiList<Addon>>(`${rootPath}/addons`),
    ]);

    state.models = models.data;
    state.addons = addons.data;
  } finally {
    state.loading = false;
  }
}

async function loadProjects(workspaceId: string): Promise<void> {
  state.workspaceId = workspaceId;
  state.projects = [];
  state.projectId = "";
  state.models = [];
  state.addons = [];

  if (!workspaceId) {
    render();
    return;
  }

  state.loading = true;
  render();

  try {
    const result = await arsyApi.request<ApiList<Project>>(
      `/workspaces/${encodeURIComponent(workspaceId)}/projects`,
    );
    state.projects = result.data;
    state.projectId = result.data[0]?.id ?? "";
  } finally {
    state.loading = false;
  }

  await loadProjectData();
}

async function loadWorkspaces(preferredWorkspaceId?: string): Promise<void> {
  state.loading = true;
  render();

  try {
    const result = await arsyApi.request<ApiList<Workspace>>("/workspaces");
    state.workspaces = result.data;
    state.workspaceId =
      result.data.find((workspace) => workspace.id === preferredWorkspaceId)?.id ??
      result.data[0]?.id ??
      "";
  } finally {
    state.loading = false;
  }

  await loadProjects(state.workspaceId);
}

async function withBusy(action: () => Promise<void>): Promise<void> {
  state.busy = true;
  state.error = null;
  state.notice = null;
  render();

  try {
    await action();
  } catch (error) {
    state.error = getErrorMessage(error);
  } finally {
    state.busy = false;
    render();
  }
}

function setTheme(): void {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("arsy-console-theme", theme);
  render();
}

async function acceptSession(response: AuthResponse): Promise<void> {
  arsyApi.setAccessToken(response.accessToken);
  state.account = response.account;
  state.section = "overview";
  await loadWorkspaces();
  if (pendingInvitationToken) {
    const invitation = await arsyApi.request<{
      workspaceId: string;
      projectId: string;
    }>("/invitations/accept", {
      method: "POST",
      body: jsonBody({ token: pendingInvitationToken }),
    });
    pendingInvitationToken = null;
    localStorage.removeItem("arsy-pending-invitation-token");
    await loadWorkspaces(invitation.workspaceId);
    state.notice = "Undangan project berhasil diterima.";
  } else {
    state.notice = `Selamat datang, ${response.account.displayName}.`;
  }
}

async function processEmailAction(): Promise<void> {
  const url = new URL(window.location.href);
  const action = url.searchParams.get("action");
  const token = url.searchParams.get("token");
  if (!action || !token) {
    return;
  }

  if (action === "verify-email") {
    window.history.replaceState(null, "", url.pathname);
    await withBusy(async () => {
      const response = await arsyApi.request<AuthResponse>(
        "/auth/email-verification/confirm",
        { method: "POST", body: jsonBody({ token }) },
      );
      await acceptSession(response);
      state.notice = "Email berhasil diverifikasi.";
    });
    return;
  }

  if (action === "reset-password") {
    window.history.replaceState(null, "", url.pathname);
    state.authMode = "reset-password";
    state.emailActionToken = token;
    state.notice = "Buat kata sandi baru untuk melanjutkan.";
    render();
    return;
  }

  if (action === "accept-invitation") {
    pendingInvitationToken = token;
    localStorage.setItem("arsy-pending-invitation-token", token);
    window.history.replaceState(null, "", url.pathname);
    state.notice = "Masuk atau buat akun dengan email yang menerima undangan.";
    render();
  }
}

async function submitForm(form: HTMLFormElement): Promise<void> {
  const action = form.dataset.action;
  const formData = new FormData(form);

  await withBusy(async () => {
    if (action === "register") {
      const email = readFormValue(formData, "email");
      await arsyApi.request("/auth/register", {
        method: "POST",
        body: jsonBody({
          email,
          password: readFormValue(formData, "password"),
          displayName: readFormValue(formData, "displayName"),
        }),
      });
      state.authMode = "login";
      state.notice = "Periksa email untuk memverifikasi akun sebelum masuk.";
      return;
    }

    if (action === "login") {
      const response = await arsyApi.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: jsonBody({
          email: readFormValue(formData, "email"),
          password: readFormValue(formData, "password"),
        }),
      });
      await acceptSession(response);
      return;
    }

    if (action === "password-reset-request") {
      await arsyApi.request("/auth/password-reset/request", {
        method: "POST",
        body: jsonBody({ email: readFormValue(formData, "email") }),
      });
      state.notice =
        "Jika email terdaftar, tautan pengaturan ulang akan dikirim.";
      return;
    }

    if (action === "email-verification-resend") {
      await arsyApi.request("/auth/email-verification/resend", {
        method: "POST",
        body: jsonBody({ email: readFormValue(formData, "email") }),
      });
      state.notice =
        "Jika akun belum diverifikasi, tautan verifikasi akan dikirim.";
      return;
    }

    if (action === "password-reset-confirm") {
      await arsyApi.request("/auth/password-reset/confirm", {
        method: "POST",
        body: jsonBody({
          token: readFormValue(formData, "token"),
          password: readFormValue(formData, "password"),
        }),
      });
      state.authMode = "login";
      state.emailActionToken = null;
      state.notice = "Kata sandi diperbarui. Silakan masuk.";
      return;
    }

    if (action === "create-workspace") {
      const workspace = await arsyApi.request<Workspace>("/workspaces", {
        method: "POST",
        body: jsonBody({
          name: readFormValue(formData, "name"),
          slug: readFormValue(formData, "slug"),
        }),
      });

      state.notice = `Workspace ${workspace.name} dibuat.`;
      await loadWorkspaces(workspace.id);
      return;
    }

    if (action === "create-project") {
      const project = await arsyApi.request<Project>(
        `/workspaces/${encodeURIComponent(state.workspaceId)}/projects`,
        {
          method: "POST",
          body: jsonBody({
            name: readFormValue(formData, "name"),
            slug: readFormValue(formData, "slug"),
          }),
        },
      );

      state.notice = `Project ${project.name} dibuat.`;
      await loadProjects(state.workspaceId);
      state.projectId = project.id;
      await loadProjectData();
      return;
    }

    if (action === "create-model") {
      const definition = parseJsonObject(
        readFormValue(formData, "definition"),
        "Definisi model",
      );
      if (typeof definition.key !== "string") {
        throw new Error("Definisi model harus menyertakan key.");
      }

      const rootPath = projectPath();
      await arsyApi.request(`${rootPath}/models`, {
        method: "POST",
        body: jsonBody(definition),
      });
      await arsyApi.request(
        `${rootPath}/models/${encodeURIComponent(definition.key)}/publish`,
        {
          method: "POST",
          body: jsonBody({ revision: 1 }),
        },
      );
      state.notice = `Model ${definition.key} dibuat dan dipublikasikan.`;
      await loadProjectData();
      return;
    }

    if (action === "create-addon") {
      const manifest = parseJsonObject(
        readFormValue(formData, "manifest"),
        "Manifest add-on",
      );
      const created = await arsyApi.request<Addon>(
        `${projectPath()}/addons`,
        {
          method: "POST",
          body: jsonBody(manifest),
        },
      );
      state.notice = `Manifest ${created.addonId} disimpan sebagai draft.`;
      await loadProjectData();
      return;
    }

    if (action === "install-addon" || action === "update-addon") {
      const addonId = form.dataset.addonId;
      const version = form.dataset.version;
      if (!addonId || !version) {
        throw new Error("Identitas add-on tidak tersedia.");
      }

      const grantedCapabilities = formData
        .getAll("grantedCapabilities")
        .filter((value): value is string => typeof value === "string");
      const configuration = parseJsonObject(
        readFormValue(formData, "configuration"),
        "Konfigurasi add-on",
      );

      if (action === "install-addon") {
        await arsyApi.request(
          `${projectPath()}/addons/${encodeURIComponent(addonId)}/${encodeURIComponent(version)}/install`,
          {
            method: "POST",
            body: jsonBody({ grantedCapabilities, configuration }),
          },
        );
        state.notice = `Add-on ${addonId} berhasil di-install.`;
      } else {
        const installationId = form.dataset.installationId;
        if (!installationId) {
          throw new Error("Identitas instalasi add-on tidak tersedia.");
        }

        await arsyApi.request(
          `${projectPath()}/addons/installations/${encodeURIComponent(installationId)}`,
          {
            method: "PATCH",
            body: jsonBody({ grantedCapabilities, configuration }),
          },
        );
        state.notice = `Konfigurasi ${addonId} diperbarui.`;
      }

      await loadProjectData();
    }
  });
}

async function runAddonAction(
  action: "validate" | "enable" | "disable" | "uninstall",
  button: HTMLButtonElement,
): Promise<void> {
  await withBusy(async () => {
    const rootPath = projectPath();
    const installationId = button.dataset.installationId;

    if (action === "validate") {
      const addonId = button.dataset.addonId;
      const version = button.dataset.version;
      if (!addonId || !version) {
        throw new Error("Identitas manifest add-on tidak tersedia.");
      }

      await arsyApi.request(
        `${rootPath}/addons/${encodeURIComponent(addonId)}/${encodeURIComponent(version)}/validate`,
        { method: "POST" },
      );
      state.notice = `Manifest ${addonId} valid.`;
    } else {
      if (!installationId) {
        throw new Error("Identitas instalasi add-on tidak tersedia.");
      }

      const method = action === "uninstall" ? "DELETE" : "POST";
      const suffix = action === "uninstall" ? "" : `/${action}`;
      await arsyApi.request(
        `${rootPath}/addons/installations/${encodeURIComponent(installationId)}${suffix}`,
        { method },
      );
      state.notice =
        action === "uninstall"
          ? "Add-on berhasil di-uninstall."
          : `Add-on berhasil di-${action === "enable" ? "aktifkan" : "nonaktifkan"}.`;
    }

    await loadProjectData();
  });
}

async function logout(): Promise<void> {
  await withBusy(async () => {
    let logoutError: string | null = null;

    try {
      await arsyApi.request("/auth/logout", { method: "POST" });
    } catch (error) {
      logoutError = getErrorMessage(error);
    } finally {
      arsyApi.setAccessToken(null);
      state.account = null;
      state.workspaces = [];
      state.workspaceId = "";
      state.projects = [];
      state.projectId = "";
      state.models = [];
      state.addons = [];
      state.error = logoutError
        ? `Sesi dihapus dari browser, tetapi server belum mengonfirmasi logout: ${logoutError}`
        : null;
    }
  });
}

root.addEventListener("submit", (event: SubmitEvent) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  event.preventDefault();
  void submitForm(form);
});

root.addEventListener("change", (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  const selection = target.dataset.select;
  if (selection === "workspace") {
    void withBusy(() => loadProjects(target.value));
  } else if (selection === "project") {
    void withBusy(async () => {
      state.projectId = target.value;
      await loadProjectData();
    });
  }
});

root.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const sectionButton = target.closest<HTMLButtonElement>("[data-section]");
  if (sectionButton?.dataset.section) {
    state.section = sectionButton.dataset.section as ConsoleSection;
    state.error = null;
    state.notice = null;
    render();
    return;
  }

  const actionButton = target.closest<HTMLButtonElement>("[data-action]");
  if (!actionButton) {
    return;
  }

  switch (actionButton.dataset.action) {
    case "toggle-auth":
      state.authMode = state.authMode === "login" ? "register" : "login";
      state.error = null;
      state.notice = null;
      render();
      break;
    case "show-login":
      state.authMode = "login";
      state.emailActionToken = null;
      state.error = null;
      state.notice = null;
      render();
      break;
    case "forgot-password":
      state.authMode = "forgot-password";
      state.error = null;
      state.notice = null;
      render();
      break;
    case "resend-verification":
      state.authMode = "resend-verification";
      state.error = null;
      state.notice = null;
      render();
      break;
    case "toggle-theme":
      setTheme();
      break;
    case "logout":
      void logout();
      break;
    case "validate-addon":
      void runAddonAction("validate", actionButton);
      break;
    case "enable-addon":
      void runAddonAction("enable", actionButton);
      break;
    case "disable-addon":
      void runAddonAction("disable", actionButton);
      break;
    case "uninstall-addon":
      void runAddonAction("uninstall", actionButton);
      break;
  }
});

render();
void processEmailAction();
