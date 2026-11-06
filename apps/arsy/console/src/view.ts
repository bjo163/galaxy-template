import type {
  Account,
  Addon,
  Model,
  Project,
  Workspace,
} from "./types";

export type ConsoleSection = "overview" | "models" | "addons";
export type AuthMode = "login" | "register";

export type ConsoleViewState = {
  account: Account | null;
  authMode: AuthMode;
  workspaces: Workspace[];
  workspaceId: string;
  projects: Project[];
  projectId: string;
  models: Model[];
  addons: Addon[];
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
  const title = isRegister ? "Buat akun Arsy" : "Masuk ke Arsy";
  const description = isRegister
    ? "Gunakan akun ini untuk mengelola workspace dan project."
    : "Masuk untuk mengelola model dan add-on project.";

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
        <form class="form-stack" data-action="${isRegister ? "register" : "login"}">
          ${
            isRegister
              ? `<label>Nama tampilan<input name="displayName" autocomplete="name" required maxlength="120" /></label>`
              : ""
          }
          <label>Email<input name="email" type="email" autocomplete="email" required maxlength="320" /></label>
          <label>Kata sandi<input name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" required minlength="12" maxlength="256" /></label>
          <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>
            ${state.busy ? "Memproses..." : isRegister ? "Buat akun" : "Masuk"}
          </button>
        </form>
        <p class="auth-switch">
          ${isRegister ? "Sudah punya akun?" : "Belum punya akun?"}
          <button class="text-button" type="button" data-action="toggle-auth">
            ${isRegister ? "Masuk" : "Daftar"}
          </button>
        </p>
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
    { id: "addons", label: "Add-on" },
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
  if (!state.workspaceId) {
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

  return `
    <section class="page-heading">
      <div><p class="eyebrow">Project / Model</p><h1>Model</h1><p class="lede">Buat definisi dan publikasikan revisi model untuk project terpilih.</p></div>
    </section>
    ${state.loading ? `<p class="loading-state" role="status">Memuat model...</p>` : ""}
    <section class="panel" aria-labelledby="model-list-title">
      <div class="panel-heading"><div><p class="eyebrow">Catalog</p><h2 id="model-list-title">Definisi model</h2></div></div>
      ${modelList}
    </section>
    <section class="panel panel-form" aria-labelledby="model-create-title">
      <div><p class="eyebrow">Model baru</p><h2 id="model-create-title">Buat dan publikasikan</h2><p>Arsy membuat revisi pertama, lalu memublikasikannya.</p></div>
      <form class="form-stack" data-action="create-model">
        <label>Definisi model dalam JSON<textarea name="definition" required spellcheck="false" autocapitalize="off" autocomplete="off" placeholder='{"key":"contacts","displayName":"Contacts","fields":[{"key":"name","type":"string","required":true,"indexed":false,"unique":false}],"access":{"defaultVisibility":"private"}}'></textarea></label>
        <details class="example-details"><summary>Lihat contoh definisi</summary><pre>${escapeHtml(JSON.stringify(sampleModel, null, 2))}</pre></details>
        <button class="button button-primary" type="submit" ${state.busy ? "disabled" : ""}>Buat model dan publikasikan</button>
      </form>
    </section>`;
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
  root: HTMLElement,
  state: ConsoleViewState,
): void {
  root.innerHTML = state.account
    ? renderConsole(state)
    : renderAuth(state);
}
