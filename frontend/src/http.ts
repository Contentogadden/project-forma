type CsrfToken = { headerName: string; token: string };

export async function getCsrfToken(): Promise<CsrfToken> {
  const response = await fetch('/api/auth/csrf');
  if (!response.ok) throw new Error('Не удалось получить защитный токен. Войдите снова.');
  return response.json();
}

function requestError(status: number): string {
  if (status === 401) return 'Сессия завершилась. Войдите снова.';
  if (status === 403) return 'Недостаточно прав.';
  return 'Не удалось выполнить запрос. Попробуйте снова.';
}

export async function requestJson<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (method !== 'GET') {
    const csrf = await getCsrfToken();
    headers[csrf.headerName] = csrf.token;
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || requestError(response.status));
  }
  return response.json();
}
