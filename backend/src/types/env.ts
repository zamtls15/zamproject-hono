export type GatewaySecrets = {
  GITHUB_TOKEN?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
};

export type Bindings = {
  DB: D1Database;
} & GatewaySecrets;

export type Variables = {
  validated?: unknown;
};
