// src/app/api/ca/utils.ts
import crypto from 'crypto'

/** PEM 줄바꿈/공백 정리 */
export function normalizePem(pem: string): string {
  // CRLF -> LF로 통일하고 앞뒤 공백 제거
  return pem.replace(/\r\n/g, '\n').trim() + '\n'
}

/** 공개키 해시 계산: "PEM 텍스트 자체"에 SHA-256 적용 */
export function getPublicKeyHash(pem: string): string {
  const normalized = normalizePem(pem)
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex')
}

/** 인증서에 서명/검증에 사용할 payload 문자열 */
export function buildCertPayload(username: string, pubkeyHash: string): string {
  return JSON.stringify({ username, pubkey_sha256: pubkeyHash })
}
