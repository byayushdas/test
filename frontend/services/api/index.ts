export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api");

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error || errData.message) {
        errorMessage = errData.error || errData.message;
      }
    } catch (_) {}
    throw new Error(errorMessage);
  }

  return response.json();
}
