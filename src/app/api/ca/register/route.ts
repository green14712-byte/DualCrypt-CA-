// src/app/api/ca/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPublicKeyHash, buildCertPayload } from '../utils'

// .env에서 읽어온 PEM 문자열의 "\n"을 실제 개행으로 복원
function loadPemFromEnv(varName: string): string {
  const value = process.env[varName]
  if (!value) {
    throw new Error(`${varName} 환경 변수가 설정되어 있지 않습니다.`)
  }
  // "\\n" 문자열을 실제 개행 문자로 교체
  return value.replace(/\\n/g, '\n')
}

let CA_PRIVATE_KEY: string
try {
  CA_PRIVATE_KEY = loadPemFromEnv('CA_PRIVATE_KEY')
} catch (err) {
  console.error(err)
  // 에러가 나도 타입 맞추려고 빈 문자열로 초기화
  CA_PRIVATE_KEY = ''
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const username = formData.get('username')?.toString().trim()
    const pubFile = formData.get('pubkey') as File | null

    if (!username || !pubFile) {
      return new NextResponse('username 또는 공개키 파일이 없습니다.', {
        status: 400,
      })
    }

    // 업로드된 공개키 PEM 텍스트
    const pubPem = await pubFile.text()

    // 공개키 해시 계산 (PEM 문자열 자체에 SHA-256)
    const pubHash = getPublicKeyHash(pubPem)

    // 서명 대상 payload
    const payload = buildCertPayload(username, pubHash)

    // CA 개인키로 서명 (여기서 CA_PRIVATE_KEY가 제대로 된 PEM이어야 함)
    const signature = crypto
      .sign('sha256', Buffer.from(payload, 'utf8'), {
        key: CA_PRIVATE_KEY,
      })
      .toString('base64')

    const cert = {
      username,
      pubkey_sha256: pubHash,
      signature,
    }

    return NextResponse.json(cert)
  } catch (err: unknown) {
    console.error('Register error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new NextResponse(`인증서 발급 실패: ${msg}`, { status: 500 })
  }
}
