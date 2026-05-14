export type AppMode = "demo" | "local" | "production";

export function getAppMode(): AppMode {
  const value = process.env.NEXT_PUBLIC_APP_MODE;
  if (value === "demo" || value === "local" || value === "production") return value;
  return process.env.NEXT_PUBLIC_SUPABASE_URL ? "local" : "demo";
}

export function isProductionMode() {
  return getAppMode() === "production";
}

export function isDemoMode() {
  return getAppMode() === "demo";
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
