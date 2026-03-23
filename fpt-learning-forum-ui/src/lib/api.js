export async function fetchJson(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text || 'Phản hồi không hợp lệ' }
  }
  if (!res.ok) {
    const msg =
      (data && typeof data.message === 'string' && data.message) ||
      res.statusText ||
      'Yêu cầu thất bại'
    const err = new Error(msg)
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}
