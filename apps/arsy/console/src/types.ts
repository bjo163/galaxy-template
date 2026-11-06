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
