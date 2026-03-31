import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("429: Too many requests. Please wait a moment and try again.");
    }
    
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.message || message;
    } catch (e) {
      const text = await res.text();
      message = text || message;
    }
    
    throw new Error(`${res.status}: ${message}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const isFormData = typeof window !== 'undefined' && data instanceof FormData;
  
  const headers: Record<string, string> = {};
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let baseUrl =  'http://localhost:5001';
  
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    // Always prefer the current hostname to avoid CORS mismatches
    baseUrl = `${protocol}//${hostname}:5001`;
  } else if (process.env.NEXT_PUBLIC_API_URL) {
    baseUrl = process.env.NEXT_PUBLIC_API_URL;
  }

  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? (isFormData ? (data as FormData) : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let baseUrl = 'http://localhost:5001';
    
    if (typeof window !== 'undefined') {
      const { hostname, protocol } = window.location;
      baseUrl = `${protocol}//${hostname}:5001`;
    } else if (process.env.NEXT_PUBLIC_API_URL) {
      baseUrl = process.env.NEXT_PUBLIC_API_URL;
    }

    const fullUrl = (queryKey[0] as string).startsWith('http') ? (queryKey[0] as string) : `${baseUrl}${queryKey[0]}`;

    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
