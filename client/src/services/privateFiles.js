const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'gilgit_rental_token'

export async function fetchPrivateFile(path) {
  const token = localStorage.getItem(TOKEN_KEY)

  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    let message = 'Unable to open the private file'
    try {
      const payload = await response.json()
      message = payload?.message || message
    } catch {
      // The response may be binary or plain text.
    }
    throw new Error(message)
  }

  return response.blob()
}

export async function createPrivateFileUrl(path) {
  const blob = await fetchPrivateFile(path)
  return URL.createObjectURL(blob)
}
