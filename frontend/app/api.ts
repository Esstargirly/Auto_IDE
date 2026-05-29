export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://auto-ide.onrender.com";

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

export function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
