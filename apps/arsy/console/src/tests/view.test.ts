import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderConsoleApp, type ConsoleViewState } from "../view.js";

function createState(
  overrides: Partial<ConsoleViewState> = {},
): ConsoleViewState {
  return {
    account: {
      id: "00000000-0000-4000-8000-000000000001",
      email: "owner@example.com",
      displayName: "Owner",
    },
    authMode: "login",
    emailActionToken: null,
    workspaces: [],
    workspaceRole: "owner",
    workspaceId: "00000000-0000-4000-8000-000000000002",
    projects: [],
    projectId: "00000000-0000-4000-8000-000000000003",
    models: [],
    addons: [],
    credentials: [],
    users: [],
    invitations: [],
    oneTimeCredential: null,
    recordModelKey: "",
    recordDefinition: null,
    records: [],
    recordCursor: null,
    auditEvents: [],
    auditCursor: null,
    auditProjectFilter: "",
    auditActionFilter: "",
    section: "overview",
    busy: false,
    loading: false,
    error: null,
    notice: null,
    ...overrides,
  };
}

function render(state: ConsoleViewState): string {
  const root: Pick<HTMLElement, "innerHTML"> = { innerHTML: "" };
  renderConsoleApp(root, state);
  return root.innerHTML;
}

describe("Arsy console administration views", () => {
  it("renders model fields and escaped record values with bounded pagination", () => {
    const markup = render(
      createState({
        section: "records",
        recordModelKey: "contacts",
        recordDefinition: {
          key: "contacts",
          displayName: "Contacts",
          fields: [
            { key: "name", type: "string" },
            { key: "details", type: "json" },
          ],
          access: { defaultVisibility: "private" },
        },
        models: [
          {
            id: "model-id",
            key: "contacts",
            displayName: "Contacts",
            activeRevision: 1,
            status: "active",
          },
        ],
        records: [
          {
            id: "record-id",
            name: "<img src=x>",
            details: { active: true },
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        recordCursor: "next-page",
      }),
    );

    assert.match(markup, /name <span class="muted">\(string\)<\/span>/);
    assert.match(markup, /&lt;img src=x&gt;/);
    assert.doesNotMatch(markup, /<img src=x>/);
    assert.match(markup, /data-action="load-more-records"/);
  });

  it("shows a credential secret only in the creation result and offers scoped actions", () => {
    const markup = render(
      createState({
        section: "access",
        oneTimeCredential: {
          label: "Production",
          secret: "arsy_proj_single-use",
        },
        credentials: [
          {
            id: "credential-id",
            label: "Production",
            keyPrefix: "arsy_proj_prefix",
            scopes: ["records:read"],
            expiresAt: null,
            revokedAt: null,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );

    assert.match(markup, /arsy_proj_single-use/);
    assert.match(markup, /data-action="rotate-credential"/);
    assert.match(markup, /data-action="revoke-credential"/);
    assert.match(markup, /data-action="create-credential"/);
    assert.match(markup, /data-action="create-invitation"/);
  });

  it("disables membership and credential mutations while an action is pending", () => {
    const markup = render(
      createState({
        section: "access",
        busy: true,
        credentials: [
          {
            id: "credential-id",
            label: "Production",
            keyPrefix: "arsy_proj_prefix",
            scopes: ["records:read"],
            expiresAt: null,
            revokedAt: null,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        users: [
          {
            accountId: "member-id",
            email: "member@example.com",
            displayName: "Member",
            role: "member",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        invitations: [
          {
            id: "invitation-id",
            email: "invite@example.com",
            role: "member",
            expiresAt: "2099-02-01T00:00:00.000Z",
            acceptedAt: null,
            revokedAt: null,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );

    assert.match(
      markup,
      /data-action="rotate-credential"[^>]*disabled/,
    );
    assert.match(
      markup,
      /data-action="remove-project-user"[^>]*disabled/,
    );
    assert.match(
      markup,
      /data-action="revoke-invitation"[^>]*disabled/,
    );
  });

  it("hides workspace administration and audit controls from project-only members", () => {
    const markup = render(
      createState({
        section: "access",
        workspaceRole: "project_member",
        users: [
          {
            accountId: "member-id",
            email: "member@example.com",
            displayName: "Member",
            role: "member",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );

    assert.match(markup, /Anggota project/);
    assert.doesNotMatch(markup, /data-section="audit"/);
    assert.doesNotMatch(markup, /data-section="addons"/);
    assert.doesNotMatch(markup, /data-action="remove-project-user"/);
    assert.doesNotMatch(markup, /data-action="create-invitation"/);
    assert.doesNotMatch(markup, /data-action="create-credential"/);
    assert.doesNotMatch(markup, /data-action="revoke-credential"/);
  });
});
