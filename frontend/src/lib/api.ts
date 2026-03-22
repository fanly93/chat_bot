const API_BASE = "/api";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  return { access, refresh };
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function refreshAccessToken(): Promise<boolean> {
  const { refresh } = getTokens();
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (!headers.has("Content-Type") && fetchOptions.body && typeof fetchOptions.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const { access } = getTokens();
    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
    }
  }

  let res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const { access } = getTokens();
      headers.set("Authorization", `Bearer ${access}`);
      res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
    } else {
      clearTokens();
      window.location.href = "/login";
      throw new Error("认证已过期，请重新登录");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `请求失败 (${res.status})`);
  }

  return res.json();
}

export async function apiLogin(username: string, password: string) {
  const data = await apiFetch<{ access_token: string; refresh_token: string }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    }
  );
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function apiRegister(username: string, email: string, password: string) {
  const data = await apiFetch<{ access_token: string; refresh_token: string }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
      skipAuth: true,
    }
  );
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function apiGetMe() {
  return apiFetch<{
    id: string;
    username: string;
    email: string;
    created_at: string;
  }>("/auth/me");
}

export async function apiLogout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    clearTokens();
  }
}
