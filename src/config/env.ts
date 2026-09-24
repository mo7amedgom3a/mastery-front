const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export function getApiBaseUrl(): string {
  const value = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;

  try {
    new URL(value);
  } catch {
    throw new Error("API_BASE_URL must be a valid absolute URL");
  }

  return value.replace(/\/$/, "");
}
