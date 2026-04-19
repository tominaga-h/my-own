export class ApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const body = await response.clone().json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    /* non-JSON body — fall through */
  }
  return undefined;
}

export function createApiFetcher(apiKey: string) {
  return async function fetcher<T = unknown>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new ApiError(response.status, message);
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
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}
