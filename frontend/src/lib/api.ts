const API_BASE = "/api";
const BACKEND_BASE = "http://localhost:8000/api";

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

  if (res.status === 204) {
    return undefined as T;
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

// ---- Models API ----

export interface Model {
  id: string;
  display_name: string;
  description: string;
  provider: "openai" | "deepseek" | "qwen" | "zhipu";
  supports_thinking: boolean;
}

export async function apiGetModels() {
  return apiFetch<Model[]>("/models", { skipAuth: true });
}

// ---- Conversation API ----

export interface Conversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface SearchSource {
  title: string;
  url: string;
  content: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning_content?: string | null;
  sources?: SearchSource[];
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export async function apiListConversations() {
  return apiFetch<Conversation[]>("/conversations");
}

export async function apiCreateConversation(title = "新对话", model = "deepseek-chat") {
  return apiFetch<Conversation>("/conversations", {
    method: "POST",
    body: JSON.stringify({ title, model }),
  });
}

export async function apiGetConversation(id: string) {
  return apiFetch<ConversationDetail>(`/conversations/${id}`);
}

export async function apiUpdateConversation(id: string, data: { title?: string; model?: string }) {
  return apiFetch<Conversation>(`/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteConversation(id: string) {
  await apiFetch(`/conversations/${id}`, { method: "DELETE" });
}

// ---- SSE Stream ----

export interface StreamCallbacks {
  onThinking: (text: string) => void;
  onContent: (text: string) => void;
  onDone: (reasoning_content: string, content: string) => void;
  onTitleGenerated?: (title: string) => void;
  onSearching?: (query: string) => void;
  onSources?: (sources: SearchSource[]) => void;
  onError: (error: Error) => void;
}

export async function apiStreamMessage(
  conversationId: string,
  content: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  enableSearch: boolean = false,
) {
  const { access } = (() => {
    if (typeof window === "undefined") return { access: null };
    return {
      access: localStorage.getItem("access_token"),
    };
  })();

  const res = await fetch(`${BACKEND_BASE}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    body: JSON.stringify({ content, enable_search: enableSearch }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    callbacks.onError(new Error(body.detail || `请求失败 (${res.status})`));
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        try {
          const data = JSON.parse(raw);
          if (data.type === "thinking") {
            callbacks.onThinking(data.content);
          } else if (data.type === "content") {
            callbacks.onContent(data.content);
          } else if (data.type === "done") {
            callbacks.onDone(data.reasoning_content || "", data.content || "");
          } else if (data.type === "title_generated") {
            callbacks.onTitleGenerated?.(data.title);
          } else if (data.type === "searching") {
            callbacks.onSearching?.(data.query || "");
          } else if (data.type === "sources") {
            callbacks.onSources?.(data.sources || []);
          } else if (data.type === "error" || data.type === "search_error") {
            callbacks.onError(new Error(data.message || "请求失败"));
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      callbacks.onError(err as Error);
    }
  }
}
