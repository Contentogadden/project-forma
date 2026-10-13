import { getCsrfToken } from './http.ts';

export async function logout(setViewer: (v: null) => void) {
  try {
    const csrf = await getCsrfToken();
    await fetch('/api/auth/logout', { method: 'POST', headers: { [csrf.headerName]: csrf.token } });
  } finally {
    setViewer(null);
  }
}
