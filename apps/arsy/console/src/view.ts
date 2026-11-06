import type {
  Account,
  Addon,
  AuditEvent,
  ModelDefinition,
  Model,
  ProjectCredential,
  ProjectInvitation,
  ProjectUser,
  Project,
  Workspace,
} from "./types";

export type ConsoleSection =
  | "overview"
  | "models"
  | "records"
  | "access"
  | "audit"
  | "addons";
export type AuthMode =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "resend-verification";

export type ConsoleViewState = {
  account: Account | null;
  authMode: AuthMode;
  emailActionToken: string | null;
  workspaces: Workspace[];
  workspaceRole: string;
  workspaceId: string;
  projects: Project[];
  projectId: string;
  models: Model[];
  addons: Addon[];
  credentials: ProjectCredential[];
  users: ProjectUser[];
  invitations: ProjectInvitation[];
  oneTimeCredential: { label: string; secret: string } | null;
  recordModelKey: string;
  recordDefinition: ModelDefinition | null;
  records: Array<Record<string, unknown>>;
  recordCursor: string | null;
  auditEvents: AuditEvent[];
  auditCursor: string | null;
  auditProjectFilter: string;
  auditActionFilter: string;
  section: ConsoleSection;
  busy: boolean;
  loading: boolean;
  error: string | null;
  notice: string | null;
};

const sampleModel = {
  key: "contacts",
  displayName: "Contacts",
  fields: [
    {
      key: "name",
      type: "string",
      required: true,
      indexed: false,
      unique: false,
    },
  ],
  access: { defaultVisibility: "private" },
};

const sampleAddon = {
  id: "com.example.contacts",
  version: "1.0.0",
  arsyApi: "^1",
  kind: "declarative",
  scope: "project",
  dependencies: [],
  capabilities: ["records.read"],
  permissions: [],
  configSchema: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {},
  },
};

export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function message(state: ConsoleViewState): string {
  if (state.error) {
    return `<p class="notice notice-error" role="alert">${escapeHtml(state.error)}</p>`;
  }

  if (state.notice) {
    return `<p class="notice notice-success" role="status">${escapeHtml(state.notice)}</p>`;
  }

  return "";
}

function button(
  label: string,
  action: string,
  attributes = "",
  disabled = false,
): string {
  return `<button class="button button-secondary" type="button" data-action="${escapeHtml(action)}" ${attributes} ${disabled ? "disabled" : ""}>${escapeHtml(label)}</button>`;
}

function renderAuth(state: ConsoleViewState): string {
  const isRegister = state.authMode === "register";
  const isForgotPassword = state.authMode === "forgot-password";
  const isResetPassword = state.authMode === "reset-password";
  const isResendVerification = state.authMode === "resend-verification";
  const title = isRegister
    ? "Buat akun Arsy"
    : isForgotPassword
      ? "Atur ulang kata sandi"
      : isResetPassword
        ? "Buat kata sandi baru"
        : isResendVerification
          ? "Kirim ulang verifikasi"
          : "Masuk ke Arsy";
  const description = isRegister
    ? "Kami akan mengirim tautan untuk memverifikasi alamat email."
    : isForgotPassword
      ? "Masukkan email akun untuk menerima tautan pengaturan ulang."
      : isResetPassword
        ? "Gunakan kata sandi baru untuk akun Arsy."
        : isResendVerification
          ? "Masukkan email akun yang belum diverifikasi."
          : "Masuk untuk mengelola model dan add-on project.";
  const formAction = isRegister
    ? "register"
    : isForgotPassword
      ? "password-reset-request"
      : isResetPassword
        ? "password-reset-confirm"
        : isResendVerification
          ? "email-verification-resend"
          : "login";
  const showEmail = !isResetPassword;
  const showPassword = isRegister || isResetPassword || state.authMode === "login";
  const submitLabel = isRegister
    ? "Buat akun"
    : isForgotPassword
      ? "Kirim tautan"
      : isResetPassword
        ? "Simpan kata sandi"
        : isResendVerification
          ? "Kirim ulang tautan"
          : "Masuk";

  return `
    <main class="auth-layout" id="main">
      <section class="auth-panel" aria-labelledby="auth-title">
        <a class="brand brand-auth" href="/" aria-label="Arsy Console">
          <span class="brand-mark" aria-hidden="true">A</span>
          <span>Arsy</span>
        </a>
        <p class="eyebrow">Console</p>
        <h1 id="auth-title">${title}</h1>
        <p class="lede">${description}</p>
        ${message(state)}
        <form class="form-stack" data-action="${formAction}">
          ${
            isRegister
              ? `<label>Nama tampilan<input name="displayName" autocomplete="name" required maxlength="120" /></label>`
              : ""
          }
          ${
            showEmail
              ? `<label>Email<input name="email" type="email" autocomplete="email" required maxlength="320" /></label>`
              : `<input name="token" type="hidden" value="${escapeHtml(state.emailActionToken ?? "")}" />`
          }
          ${
            showPassword
              ? `<label>Kata sandi<input name="password" type="password" autocomplete="${isRegister || isResetPassword ? "new-password" : "current-password"}" required minlength="12" maxlength="256" /></label>`
              : ""
          }
          <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>
            ${state.busy ? "Memproses..." : submitLabel}
          </button>
        </form>
        ${
          isRegister
            ? `<p class="auth-switch">Sudah punya akun? <button class="text-button" type="button" data-action="show-login">Masuk</button></p>`
            : isForgotPassword || isResetPassword || isResendVerification
              ? `<p class="auth-switch"><button class="text-button" type="button" data-action="show-login">Kembali ke masuk</button></p>`
              : `<p class="auth-switch">${isForgotPassword ? "" : "Belum punya akun?"} <button class="text-button" type="button" data-action="toggle-auth">${isRegister ? "Masuk" : "Daftar"}</button></p>
                <p class="auth-switch"><button class="text-button" type="button" data-action="forgot-password">Lupa kata sandi?</button></p>
                <p class="auth-switch"><button class="text-button" type="button" data-action="resend-verification">Kirim ulang verifikasi email</button></p>`
        }
        <p class="draft-note">Draft tanpa arahan visual Arsy. Dials: ENERGY 1 / RHYTHM 1 / MOTION 1.</p>
      </section>
    </main>`;
}

function renderScopeSelectors(state: ConsoleViewState): string {
  const workspaceOptions = state.workspaces
    .map(
      (workspace) =>
        `<option value="${escapeHtml(workspace.id)}" ${workspace.id === state.workspaceId ? "selected" : ""}>${escapeHtml(workspace.name)}</option>`,
    )
    .join("");
  const projectOptions = state.projects
    .map(
      (project) =>
        `<option value="${escapeHtml(project.id)}" ${project.id === state.projectId ? "selected" : ""}>${escapeHtml(project.name)}</option>`,
    )
    .join("");

  return `
    <div class="scope-selectors">
      <label>Workspace
        <select name="workspace" data-select="workspace" ${state.workspaces.length === 0 || state.busy ? "disabled" : ""}>
          <option value="">Pilih workspace</option>${workspaceOptions}
        </select>
      </label>
      <label>Project
        <select name="project" data-select="project" ${state.projects.length === 0 || state.busy ? "disabled" : ""}>
          <option value="">Pilih project</option>${projectOptions}
        </select>
      </label>
    </div>`;
}

function renderNavigation(state: ConsoleViewState): string {
  const items: Array<{ id: ConsoleSection; label: string }> = [
    { id: "overview", label: "Ringkasan" },
    { id: "models", label: "Model" },
    { id: "records", label: "Data" },
    { id: "access", label: "Akses" },
    ...(state.workspaceRole === "project_member"
      ? []
      : [{ id: "audit" as const, label: "Audit" }]),
    ...(state.workspaceRole === "project_member"
      ? []
      : [{ id: "addons" as const, label: "Add-on" }]),
  ];

  return `
    <nav class="primary-nav" aria-label="Navigasi console">
      ${items
        .map(
          (item) =>
            `<button class="nav-button ${state.section === item.id ? "is-current" : ""}" type="button" data-section="${item.id}" aria-current="${state.section === item.id ? "page" : "false"}">${item.label}</button>`,
        )
        .join("")}
    </nav>`;
}

function formatRecordValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function renderRecords(state: ConsoleViewState): string {
  if (!state.projectId) {
    return `<section class="empty-state"><h2>Pilih project</h2><p>Pilih workspace dan project sebelum menelusuri data.</p></section>`;
  }

  const activeModels = state.models.filter(
    (model) => model.activeRevision !== null,
  );
  if (activeModels.length === 0) {
    return `
      <section class="page-heading"><div><p class="eyebrow">Project / Data</p><h1>Data</h1><p class="lede">Publikasikan model sebelum menelusuri record.</p></div></section>
      <section class="empty-state"><h2>Belum ada model aktif</h2><p>Buat dan publikasikan model pada bagian Model.</p></section>`;
  }

  const fields = state.recordDefinition?.fields ?? [];
  const rows =
    state.records.length === 0
      ? `<tr><td colspan="${fields.length + 2}">Belum ada record yang dapat ditampilkan.</td></tr>`
      : state.records
          .map(
            (record) =>
              `<tr><th scope="row"><code>${escapeHtml(record.id)}</code></th>${fields
                .map(
                  (field) =>
                    `<td>${escapeHtml(formatRecordValue(record[field.key]))}</td>`,
                )
                .join("")}<td>${escapeHtml(formatRecordValue(record.createdAt))}</td></tr>`,
          )
          .join("");

  return `
    <section class="page-heading">
      <div><p class="eyebrow">Project / Data</p><h1>Data</h1><p class="lede">Record dibatasi pada model dan akses project yang dipilih.</p></div>
    </section>
    ${state.loading ? `<p class="loading-state" role="status">Memuat record...</p>` : ""}
    <section class="panel" aria-labelledby="record-list-title">
      <div class="form-grid record-controls">
        <label for="record-model">Model aktif
          <select id="record-model" data-select="record-model" ${state.loading ? "disabled" : ""}>
            ${activeModels
              .map(
                (model) =>
                  `<option value="${escapeHtml(model.key)}" ${model.key === state.recordModelKey ? "selected" : ""}>${escapeHtml(model.displayName)} (${escapeHtml(model.key)})</option>`,
              )
              .join("")}
          </select>
        </label>
      </div>
      <div class="panel-heading"><p class="eyebrow">Records</p><h2 id="record-list-title">${escapeHtml(state.recordDefinition?.displayName ?? state.recordModelKey)}</h2></div>
      <div class="table-wrap">
        <table>
          <caption class="sr-only">Record ${escapeHtml(state.recordDefinition?.displayName ?? state.recordModelKey)}</caption>
          <thead><tr><th scope="col">ID</th>${fields
            .map(
              (field) =>
                `<th scope="col">${escapeHtml(field.key)} <span class="muted">(${escapeHtml(field.type)})</span></th>`,
            )
            .join("")}<th scope="col">Dibuat</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${
        state.recordCursor
          ? `<div class="pagination-actions"><button class="button button-secondary" type="button" data-action="load-more-records" ${state.busy || state.loading ? "disabled" : ""}>Muat lebih banyak</button></div>`
          : ""
      }
    </section>`;
}

function renderCredentialAccess(state: ConsoleViewState): string {
  const canManage = ["owner", "admin"].includes(state.workspaceRole);
  const canRead = ["owner", "admin", "developer"].includes(
    state.workspaceRole,
  );
  if (!canRead) {
    return "";
  }
  const rows =
    state.credentials.length === 0
      ? `<p class="empty-copy">Belum ada kredensial untuk project ini.</p>`
      : `<div class="table-wrap"><table>
          <thead><tr><th scope="col">Label</th><th scope="col">Prefix</th><th scope="col">Scopes</th><th scope="col">Kedaluwarsa</th><th scope="col">Status</th>${canManage ? "<th scope=\"col\">Aksi</th>" : ""}</tr></thead>
          <tbody>${state.credentials
            .map((credential) => {
              const expired =
                credential.expiresAt !== null &&
                Date.parse(credential.expiresAt) <= Date.now();
              const active = !credential.revokedAt && !expired;
              return `<tr>
                <th scope="row">${escapeHtml(credential.label)}</th>
                <td><code>${escapeHtml(credential.keyPrefix)}</code></td>
                <td>${credential.scopes.map(escapeHtml).join(", ")}</td>
                <td>${credential.expiresAt ? escapeHtml(credential.expiresAt) : "Tidak dibatasi"}</td>
                <td>${credential.revokedAt ? "Dicabut" : expired ? "Kedaluwarsa" : "Aktif"}</td>
                ${
                  canManage
                    ? `<td class="action-cell">${active ? `<button class="button button-secondary" type="button" data-action="rotate-credential" data-id="${escapeHtml(credential.id)}" ${state.busy ? "disabled" : ""}>Rotasi</button><button class="button button-secondary" type="button" data-action="revoke-credential" data-id="${escapeHtml(credential.id)}" ${state.busy ? "disabled" : ""}>Cabut</button>` : "—"}</td>`
                    : ""
                }
              </tr>`;
            })
            .join("")}</tbody>
        </table></div>`;

  return `
    <section class="panel" aria-labelledby="credential-title">
      <div class="panel-heading"><p class="eyebrow">Project credentials</p><h2 id="credential-title">Kredensial API</h2><p>Secret hanya ditampilkan setelah pembuatan atau rotasi.</p></div>
      ${state.oneTimeCredential ? `<div class="notice notice-success" role="status"><p>Salin secret ${escapeHtml(state.oneTimeCredential.label)} sekarang. Secret tidak disimpan di daftar kredensial.</p><output class="secret-value">${escapeHtml(state.oneTimeCredential.secret)}</output><button class="button button-secondary" type="button" data-action="dismiss-credential-secret">Sembunyikan secret</button></div>` : ""}
      ${rows}
      ${
        canManage
          ? `<form class="form-stack" data-action="create-credential">
              <h3>Buat kredensial</h3>
              <div class="form-grid">
                <label>Label<input name="label" required maxlength="120" /></label>
                <label>Kedaluwarsa (opsional)<input name="expiresAt" type="datetime-local" /></label>
              </div>
              <fieldset class="scope-options"><legend>Scopes</legend>
                ${[
                  "models:read",
                  "models:manage",
                  "records:read",
                  "records:write",
                  "addons:manage",
                ]
                  .map(
                    (scope) =>
                      `<label class="check-row"><input type="checkbox" name="scopes" value="${scope}" /><span>${scope}</span></label>`,
                  )
                  .join("")}
              </fieldset>
              <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>Buat kredensial</button>
            </form>`
          : ""
      }
    </section>`;
}

function renderProjectAccess(state: ConsoleViewState): string {
  const canManage = ["owner", "admin"].includes(state.workspaceRole);
  const projectUsers =
    state.users.length === 0
      ? `<p class="empty-copy">Belum ada anggota project.</p>`
      : `<div class="table-wrap"><table>
          <thead><tr><th scope="col">Nama</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Bergabung</th>${canManage ? "<th scope=\"col\">Aksi</th>" : ""}</tr></thead>
          <tbody>${state.users
            .map(
              (user) =>
                `<tr><th scope="row">${escapeHtml(user.displayName)}</th><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.role)}</td><td>${escapeHtml(user.createdAt)}</td>${canManage ? `<td><button class="button button-secondary" type="button" data-action="remove-project-user" data-id="${escapeHtml(user.accountId)}" ${state.busy ? "disabled" : ""}>Hapus akses</button></td>` : ""}</tr>`,
            )
            .join("")}</tbody>
        </table></div>`;
  const invitationRows =
    state.invitations.length === 0
      ? `<p class="empty-copy">Belum ada undangan.</p>`
      : `<div class="table-wrap"><table>
          <thead><tr><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Kedaluwarsa</th><th scope="col">Status</th>${canManage ? "<th scope=\"col\">Aksi</th>" : ""}</tr></thead>
          <tbody>${state.invitations
            .map((invitation) => {
              const expired = Date.parse(invitation.expiresAt) <= Date.now();
              const pending =
                !invitation.acceptedAt && !invitation.revokedAt && !expired;
              const status = invitation.acceptedAt
                ? "Diterima"
                : invitation.revokedAt
                  ? "Dicabut"
                  : expired
                    ? "Kedaluwarsa"
                    : "Menunggu";
              return `<tr><th scope="row">${escapeHtml(invitation.email)}</th><td>${escapeHtml(invitation.role)}</td><td>${escapeHtml(invitation.expiresAt)}</td><td>${status}</td>${canManage ? `<td>${pending ? `<button class="button button-secondary" type="button" data-action="revoke-invitation" data-id="${escapeHtml(invitation.id)}" ${state.busy ? "disabled" : ""}>Cabut</button>` : "—"}</td>` : ""}</tr>`;
            })
            .join("")}</tbody>
        </table></div>`;

  return `
    <section class="panel" aria-labelledby="project-users-title">
      <div class="panel-heading"><p class="eyebrow">Project access</p><h2 id="project-users-title">Anggota project</h2></div>
      ${projectUsers}
    </section>
    ${
      canManage
        ? `<section class="panel panel-form" aria-labelledby="invite-title">
            <div class="panel-heading"><p class="eyebrow">Invitations</p><h2 id="invite-title">Undang anggota</h2><p>Undangan berlaku selama 7 hari dan hanya dapat diterima oleh akun dengan email yang sama.</p></div>
            <form class="form-grid" data-action="create-invitation">
              <label>Email<input name="email" type="email" required maxlength="320" /></label>
              <label>Role
                <select name="role">
                  ${state.workspaceRole === "owner" ? '<option value="admin">Admin</option>' : ""}
                  <option value="developer">Developer</option>
                  <option value="member">Member</option>
                </select>
              </label>
              <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>Kirim undangan</button>
            </form>
            <h3>Undangan terkirim</h3>
            ${invitationRows}
          </section>`
        : ""
    }
    ${renderCredentialAccess(state)}`;
}

function renderAudit(state: ConsoleViewState): string {
  const projects = state.projects
    .map(
      (project) =>
        `<option value="${escapeHtml(project.id)}" ${project.id === state.auditProjectFilter ? "selected" : ""}>${escapeHtml(project.name)}</option>`,
    )
    .join("");
  const rows =
    state.auditEvents.length === 0
      ? `<tr><td colspan="6">Belum ada event audit yang cocok.</td></tr>`
      : state.auditEvents
          .map((event) => {
            const projectName = event.projectId
              ? state.projects.find((project) => project.id === event.projectId)
                  ?.name ?? event.projectId
              : "Workspace";
            return `<tr><th scope="row">${escapeHtml(event.action)}</th><td>${escapeHtml(projectName)}</td><td>${escapeHtml(event.resourceType)} / ${escapeHtml(event.resourceId)}</td><td><code>${escapeHtml(event.actorId)}</code></td><td>${escapeHtml(JSON.stringify(event.metadata))}</td><td>${escapeHtml(event.createdAt)}</td></tr>`;
          })
          .join("");

  return `
    <section class="page-heading">
      <div><p class="eyebrow">Workspace / Audit</p><h1>Audit</h1><p class="lede">Telusuri event dalam batas workspace dengan filter yang tepat.</p></div>
    </section>
    ${state.loading ? `<p class="loading-state" role="status">Memuat audit...</p>` : ""}
    <section class="panel">
      <form class="form-grid audit-filters" data-action="filter-audit">
        <label>Project
          <select name="projectId"><option value="">Semua project</option>${projects}</select>
        </label>
        <label>Action (cocok persis)<input name="action" value="${escapeHtml(state.auditActionFilter)}" maxlength="80" pattern="[a-z][a-z0-9._-]*" /></label>
        <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>Terapkan filter</button>
      </form>
      <div class="table-wrap">
        <table>
          <caption class="sr-only">Event audit workspace</caption>
          <thead><tr><th scope="col">Action</th><th scope="col">Project</th><th scope="col">Resource</th><th scope="col">Actor</th><th scope="col">Metadata</th><th scope="col">Waktu</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${
        state.auditCursor
          ? `<div class="pagination-actions"><button class="button button-secondary" type="button" data-action="load-more-audit" ${state.busy || state.loading ? "disabled" : ""}>Muat lebih banyak</button></div>`
          : ""
      }
    </section>`;
}

function renderWorkspaceForm(state: ConsoleViewState): string {
  return `
    <section class="panel panel-form" aria-labelledby="workspace-form-title">
      <details class="create-details" ${state.workspaces.length === 0 ? "open" : ""}>
        <summary>${state.workspaces.length ? "Buat workspace lain" : "Buat workspace"}</summary>
        <div class="details-content">
        <p class="eyebrow">Workspace</p>
        <h2 id="workspace-form-title">${state.workspaces.length ? "Buat workspace" : "Mulai dengan workspace"}</h2>
        <p>Workspace memisahkan anggota dan project dalam satu ruang kerja.</p>
        <form class="form-grid" data-action="create-workspace">
          <label>Nama workspace<input name="name" required maxlength="120" placeholder="Nama workspace" /></label>
          <label>Slug<input name="slug" required maxlength="63" pattern="[a-z0-9](?:[a-z0-9\\-]{0,61}[a-z0-9])?" placeholder="workspace-saya" /></label>
          <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>Buat workspace</button>
        </form>
        </div>
      </details>
    </section>`;
}

function renderProjectForm(state: ConsoleViewState): string {
  if (
    !state.workspaceId ||
    !["owner", "admin", "developer"].includes(state.workspaceRole)
  ) {
    return "";
  }

  return `
    <section class="panel panel-form" aria-labelledby="project-form-title">
      <details class="create-details" ${state.projects.length === 0 ? "open" : ""}>
        <summary>${state.projects.length ? "Buat project lain" : "Buat project"}</summary>
        <div class="details-content">
        <p class="eyebrow">Project</p>
        <h2 id="project-form-title">${state.projects.length ? "Buat project" : "Buat project pertama"}</h2>
        <p>Model dan add-on selalu berada di dalam satu project.</p>
        <form class="form-grid" data-action="create-project">
          <label>Nama project<input name="name" required maxlength="120" placeholder="Nama project" /></label>
          <label>Slug<input name="slug" required maxlength="63" pattern="[a-z0-9](?:[a-z0-9\\-]{0,61}[a-z0-9])?" placeholder="project-saya" /></label>
          <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>Buat project</button>
        </form>
        </div>
      </details>
    </section>`;
}

function renderOverview(state: ConsoleViewState): string {
  return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">Arsy / Overview</p>
        <h1>Ringkasan</h1>
        <p class="lede">Pilih ruang kerja, lalu siapkan project untuk model dan add-on.</p>
      </div>
    </section>
    ${state.loading ? `<p class="loading-state" role="status">Memuat data workspace dan project...</p>` : ""}
    ${renderWorkspaceForm(state)}
    ${renderProjectForm(state)}
    ${
      state.projectId
        ? `<section class="panel project-summary">
            <div>
              <p class="eyebrow">Project aktif</p>
              <h2>${escapeHtml(state.projects.find((project) => project.id === state.projectId)?.name ?? "")}</h2>
              <p>Workspace: ${escapeHtml(state.workspaces.find((workspace) => workspace.id === state.workspaceId)?.name ?? "")}</p>
            </div>
            <dl class="summary-list">
              <div><dt>Model</dt><dd>${state.models.length}</dd></div>
              <div><dt>Add-on</dt><dd>${state.addons.length}</dd></div>
            </dl>
          </section>`
        : ""
    }
    <section class="panel panel-form">
      <div>
        <p class="eyebrow">Akses</p>
        <h2>Data tetap terikat ke project</h2>
        <p>Arsy memakai sesi akun untuk console dan konteks workspace/project untuk setiap permintaan.</p>
      </div>
    </section>`;
}

function renderModels(state: ConsoleViewState): string {
  if (!state.projectId) {
    return `<section class="empty-state"><h2>Pilih project</h2><p>Pilih workspace dan project sebelum membuka model.</p></section>`;
  }

  const modelList =
    state.models.length === 0
      ? `<p class="empty-copy">Belum ada model di project ini. Buat definisi pertama di bawah.</p>`
      : `<div class="table-wrap"><table>
          <thead><tr><th scope="col">Nama</th><th scope="col">Key</th><th scope="col">Revisi aktif</th><th scope="col">Status</th></tr></thead>
          <tbody>${state.models
            .map(
              (model) =>
                `<tr><th scope="row">${escapeHtml(model.displayName)}</th><td><code>${escapeHtml(model.key)}</code></td><td>${model.activeRevision ?? "Belum dipublikasikan"}</td><td>${escapeHtml(model.status)}</td></tr>`,
            )
            .join("")}</tbody>
        </table></div>`;

  const canManageModels = ["owner", "admin", "developer"].includes(
    state.workspaceRole,
  );
  return `
    <section class="page-heading">
      <div><p class="eyebrow">Project / Model</p><h1>Model</h1><p class="lede">Buat definisi dan publikasikan revisi model untuk project terpilih.</p></div>
    </section>
    ${state.loading ? `<p class="loading-state" role="status">Memuat model...</p>` : ""}
    <section class="panel" aria-labelledby="model-list-title">
      <div class="panel-heading"><div><p class="eyebrow">Catalog</p><h2 id="model-list-title">Definisi model</h2></div></div>
      ${modelList}
    </section>
    ${
      canManageModels
        ? `<section class="panel panel-form" aria-labelledby="model-create-title">
      <div><p class="eyebrow">Model baru</p><h2 id="model-create-title">Buat dan publikasikan</h2><p>Arsy membuat revisi pertama, lalu memublikasikannya.</p></div>
      <form class="form-stack" data-action="create-model">
        <label>Definisi model dalam JSON<textarea name="definition" required spellcheck="false" autocapitalize="off" autocomplete="off" placeholder='{"key":"contacts","displayName":"Contacts","fields":[{"key":"name","type":"string","required":true,"indexed":false,"unique":false}],"access":{"defaultVisibility":"private"}}'></textarea></label>
        <details class="example-details"><summary>Lihat contoh definisi</summary><pre>${escapeHtml(JSON.stringify(sampleModel, null, 2))}</pre></details>
        <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>Buat model dan publikasikan</button>
      </form>
    </section>`
        : ""
    }`;
}

function renderAddonCard(addon: Addon, state: ConsoleViewState): string {
  const installation = addon.installation;
  const encodedAddonId = escapeHtml(addon.addonId);
  const encodedVersion = escapeHtml(addon.version);
  const grantOptions = addon.manifest.capabilities
    .map((capability) => {
      const selected = installation?.grantedCapabilities.includes(capability) ?? false;
      return `<label class="check-row"><input type="checkbox" name="grantedCapabilities" value="${escapeHtml(capability)}" ${selected ? "checked" : ""} /><span>${escapeHtml(capability)}</span></label>`;
    })
    .join("");
  const configuration = JSON.stringify(installation?.configuration ?? {}, null, 2);
  const canEditInstall = addon.status === "validated" || installation !== null;
  const actionButtons = [
    addon.status === "draft"
      ? button("Validasi manifest", "validate-addon", `data-addon-id="${encodedAddonId}" data-version="${encodedVersion}"`, state.busy)
      : "",
    installation?.status === "installed" || installation?.status === "disabled"
      ? button("Aktifkan", "enable-addon", `data-installation-id="${escapeHtml(installation.id)}"`, state.busy)
      : "",
    installation?.status === "enabled"
      ? button("Nonaktifkan", "disable-addon", `data-installation-id="${escapeHtml(installation.id)}"`, state.busy)
      : "",
    installation && installation.status !== "enabled"
      ? button("Uninstall", "uninstall-addon", `data-installation-id="${escapeHtml(installation.id)}"`, state.busy)
      : "",
  ].join("");

  return `
    <article class="addon-item">
      <div class="addon-heading">
        <div><h3>${escapeHtml(addon.addonId)}</h3><p>Versi ${encodedVersion}</p></div>
        <span class="state-label">${escapeHtml(installation?.status ?? addon.status)}</span>
      </div>
      <p class="addon-capabilities">Capability diminta: ${escapeHtml(addon.manifest.capabilities.join(", ") || "tidak ada")}</p>
      ${actionButtons ? `<div class="action-row">${actionButtons}</div>` : ""}
      ${
        canEditInstall
          ? `<form class="form-stack install-form" data-action="${installation ? "update-addon" : "install-addon"}" data-addon-id="${encodedAddonId}" data-version="${encodedVersion}" ${installation ? `data-installation-id="${escapeHtml(installation.id)}"` : ""}>
              <fieldset><legend>Capability yang diberikan</legend>${grantOptions || `<p>Manifest tidak meminta capability.</p>`}</fieldset>
              <label>Konfigurasi JSON<textarea name="configuration" required spellcheck="false" autocapitalize="off" autocomplete="off">${escapeHtml(configuration)}</textarea></label>
              <button class="button button-secondary" type="submit" ${state.busy ? "disabled" : ""}>${installation ? "Simpan konfigurasi" : "Install add-on"}</button>
            </form>`
          : ""
      }
    </article>`;
}

function renderAddons(state: ConsoleViewState): string {
  if (!state.projectId) {
    return `<section class="empty-state"><h2>Pilih project</h2><p>Pilih workspace dan project sebelum mengelola add-on.</p></section>`;
  }

  const addonList =
    state.addons.length === 0
      ? `<p class="empty-copy">Belum ada definisi add-on di project ini. Tambahkan manifest deklaratif di bawah.</p>`
      : `<div class="addon-list">${state.addons.map((addon) => renderAddonCard(addon, state)).join("")}</div>`;

  return `
    <section class="page-heading">
      <div><p class="eyebrow">Project / Add-on</p><h1>Add-on</h1><p class="lede">Tinjau manifest, berikan capability yang diminta, dan kelola status instalasi.</p></div>
    </section>
    ${state.loading ? `<p class="loading-state" role="status">Memuat add-on...</p>` : ""}
    <section class="panel" aria-labelledby="addon-list-title">
      <div class="panel-heading"><div><p class="eyebrow">Catalog</p><h2 id="addon-list-title">Manifest project</h2></div></div>
      ${addonList}
    </section>
    <section class="panel panel-form" aria-labelledby="addon-create-title">
      <div><p class="eyebrow">Add-on baru</p><h2 id="addon-create-title">Daftarkan manifest</h2><p>Manifest menyimpan metadata deklaratif. Arsy tidak mengeksekusi kode add-on.</p></div>
      <form class="form-stack" data-action="create-addon">
        <label>Manifest add-on dalam JSON<textarea name="manifest" required spellcheck="false" autocapitalize="off" autocomplete="off" placeholder='{"id":"com.example.contacts","version":"1.0.0","arsyApi":"^1","kind":"declarative","scope":"project","dependencies":[],"capabilities":["records.read"],"permissions":[],"configSchema":{"type":"object","additionalProperties":false,"required":[],"properties":{}}}'></textarea></label>
        <details class="example-details"><summary>Lihat contoh manifest</summary><pre>${escapeHtml(JSON.stringify(sampleAddon, null, 2))}</pre></details>
        <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>Simpan manifest draft</button>
      </form>
    </section>`;
}

function renderContent(state: ConsoleViewState): string {
  switch (state.section) {
    case "overview":
      return renderOverview(state);
    case "models":
      return renderModels(state);
    case "records":
      return renderRecords(state);
    case "access":
      return renderProjectAccess(state);
    case "audit":
      return renderAudit(state);
    case "addons":
      return renderAddons(state);
  }
}

function renderConsole(state: ConsoleViewState): string {
  return `
    <div class="console-shell">
      <header class="console-header">
        <a class="brand" href="/" aria-label="Arsy Console">
          <span class="brand-mark" aria-hidden="true">A</span>
          <span>Arsy</span><span class="brand-divider">/</span><span class="brand-subtitle">Console</span>
        </a>
        <div class="header-actions">
          <span class="account-email">${escapeHtml(state.account?.email ?? "")}</span>
          ${button("Ganti tema", "toggle-theme")}
          ${button("Keluar", "logout", "", state.busy)}
        </div>
      </header>
      <div class="console-body">
        <aside class="console-sidebar">
          ${renderNavigation(state)}
          ${renderScopeSelectors(state)}
          <p class="draft-note">Draft tanpa arahan visual Arsy. Dials: ENERGY 1 / RHYTHM 1 / MOTION 1.</p>
        </aside>
        <main class="console-main" id="main" tabindex="-1">
          ${message(state)}
          ${renderContent(state)}
        </main>
      </div>
    </div>`;
}

export function renderConsoleApp(
  root: Pick<HTMLElement, "innerHTML">,
  state: ConsoleViewState,
): void {
  root.innerHTML = state.account
    ? renderConsole(state)
    : renderAuth(state);
}
