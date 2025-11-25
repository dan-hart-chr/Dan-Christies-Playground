const AUTH_TOKEN_KEY = 'auth-token';

export function checkAuth(): boolean {
  return localStorage.getItem(AUTH_TOKEN_KEY) === 'authenticated';
}

export async function login(username: string, password: string): Promise<boolean> {
  // Simple client-side authentication with environment variables
  const validUsername = import.meta.env.VITE_AUTH_USERNAME;
  const validPassword = import.meta.env.VITE_AUTH_PASSWORD;

  if (username === validUsername && password === validPassword) {
    localStorage.setItem(AUTH_TOKEN_KEY, 'authenticated');
    return true;
  }

  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
