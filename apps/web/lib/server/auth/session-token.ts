const textEncoder = new TextEncoder()

function timingSafeStringEqual(a: string, b: string): boolean {
  const ba = textEncoder.encode(a)
  const bb = textEncoder.encode(b)
  if (ba.length !== bb.length) {
    return false
  }
  let out = 0
  for (let i = 0; i < ba.length; i += 1) {
    out |= ba[i]! ^ bb[i]!
  }
  return out === 0
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, textEncoder.encode(message))
  return Buffer.from(sig).toString('base64url')
}

export type SessionSealPayload = {
  userId: string
  exp: number
}

export async function sealSession(
  userId: string,
  secret: string,
  maxAgeSec: number,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec
  const payload: SessionSealPayload = { userId, exp }
  const payloadJson = JSON.stringify(payload)
  const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64url')
  const sig = await hmacSha256Base64Url(secret, payloadB64)
  return `${payloadB64}.${sig}`
}

export async function unsealSession(
  token: string,
  secret: string,
): Promise<SessionSealPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 2) {
    return null
  }
  const [payloadB64, sig] = parts
  if (!payloadB64 || !sig) {
    return null
  }
  const expected = await hmacSha256Base64Url(secret, payloadB64)
  if (!timingSafeStringEqual(sig, expected)) {
    return null
  }
  let parsed: SessionSealPayload
  try {
    parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as SessionSealPayload
  } catch {
    return null
  }
  if (typeof parsed.userId !== 'string' || !parsed.userId || typeof parsed.exp !== 'number') {
    return null
  }
  if (parsed.exp < Math.floor(Date.now() / 1000)) {
    return null
  }
  return parsed
}
