import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  endpoint: string,
  options?: RequestInit | { method: string; body: any }
): Promise<Response> {
  const defaultOptions: RequestInit = {
    method: 'GET',
    credentials: 'include',
    headers: {}
  };
  
  const mergedOptions: RequestInit = { ...defaultOptions, ...options };
  
  // If body is an object that isn't already stringified, stringify it and set content-type
  if (
    mergedOptions.body && 
    typeof mergedOptions.body === 'object' && 
    !(mergedOptions.body instanceof FormData) &&
    !(mergedOptions.body instanceof URLSearchParams)
  ) {
    mergedOptions.body = JSON.stringify(mergedOptions.body);
    
    // Set the Content-Type header if not already set
    mergedOptions.headers = {
      'Content-Type': 'application/json',
      ...mergedOptions.headers
    };
  }
  
  const res = await fetch(endpoint, mergedOptions);
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
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
