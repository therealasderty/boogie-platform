import { authFetch } from './authFetch'
import { API_BASE } from './config'

export async function fetchUmamiStats(startAt, endAt) {
  if (!startAt || !endAt) return null
  const res  = await authFetch(`${API_BASE}/get-umami-stats?startAt=${startAt}&endAt=${endAt}`)
  const json = await res.json()
  return json.success ? json.data : null
}
