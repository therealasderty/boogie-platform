export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('bb-auth-token') || (import.meta.env.DEV ? 'dev-bypass' : '');
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (res.status === 401 && !String(url).includes('/auth')) {
    window.dispatchEvent(new Event('bb-auth-expired'));
  }
  return res;
}
