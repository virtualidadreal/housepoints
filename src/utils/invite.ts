// Characters that are unambiguous (no 0/O, 1/I/L confusion)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Generate a 6-character invite code using unambiguous characters.
 */
export function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return code
}

/**
 * Check if an invite code has expired.
 */
export function isCodeExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now()
}
