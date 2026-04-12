export function createApiFetcher(apiKey: string) {
  return async function fetcher<T = unknown>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(String(response.status));
    }

    return response.json() as Promise<T>;
  };
}

export async function apiFetchJson<T = unknown>(
  apiKey: string,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(String(response.status));
  }

  return response.json() as Promise<T>;
}
