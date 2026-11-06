export type ApiList<T> = { data: T[] };

export type Account = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthResponse = {
  account: Account;
  accessToken: string;
  expiresAt: string;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export type Model = {
  id: string;
  key: string;
  displayName: string;
  activeRevision: number | null;
  status: string;
};

export type ModelDefinition = {
  key: string;
  displayName: string;
  fields: Array<{ key: string; type: string }>;
  access: { defaultVisibility: "private" | "project" };
};

export type ProjectCredential = {
  id: string;
  label: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type ProjectUser = {
  accountId: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
};

export type ProjectInvitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  projectId: string | null;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CursorPage<T> = {
  data: T[];
  nextCursor: string | null;
};

export type AddonManifest = {
  id: string;
  version: string;
  capabilities: string[];
  permissions: string[];
  dependencies: Array<{ id: string; version: string }>;
  configSchema: { required: string[] };
};

export type Addon = {
  id: string;
  addonId: string;
  version: string;
  manifest: AddonManifest;
  status: string;
  installation: null | {
    id: string;
    status: string;
    grantedCapabilities: string[];
    configuration: Record<string, unknown>;
  };
};
