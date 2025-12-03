// src/app/api/ca/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPublicKeyHash, buildCertPayload } from '../utils'

// .env 에 있는 PEM 문자열의 "\n"을 실제 줄바꿈으로 복원
function loadPemFromEnv(varName: string): string {
  const value = process.env[varName]
  if (!value) {
    throw new Error(`${varName} 환경 변수가 설정되어 있지 않습니다.`)
  }
  return value.replace(/\\n/g, '\n')
}

// CA 개인키에서 공개키를 뽑아서 재사용
let CA_PUBLIC_KEY: crypto.KeyObject
try {
  const caPriv = loadPemFromEnv('CA_PRIVATE_KEY')
  CA_PUBLIC_KEY = crypto.createPublicKey(caPriv)
} catch (err) {
  console.error('CA 공개키 로드 실패:', err)
  // 타입 맞추려고 임시 키 객체 생성 (실제로는 여기까지 오면 검증 요청도 실패할 것)
  CA_PUBLIC_KEY = crypto.createPublicKey(Buffer.from(''))
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const pubFile = formData.get('pubkey') as File | null
    const certFile = formData.get('cert') as File | null

    if (!pubFile || !certFile) {
      return new NextResponse('공개키 파일과 인증서 파일이 모두 필요합니다.', {
        status: 400,
      })
    }

    // 1) 업로드된 공개키 PEM 내용
    const pubPem = await pubFile.text()

    // 2) 인증서 JSON 파싱
    const certText = await certFile.text()
    const cert = JSON.parse(certText) as {
      username: string
      pubkey_sha256: string
      signature: string
    }

    // 3) 업로드된 공개키에서 다시 SHA-256 해시 계산
    const uploadedHash = getPublicKeyHash(pubPem)

    if (uploadedHash !== cert.pubkey_sha256) {
      // 공개키 자체가 인증서랑 다른 경우
      return new NextResponse(
        `검증 실패: 공개키 해시가 인증서와 일치하지 않습니다.\n\n` +
          `인증서 내 해시 : ${cert.pubkey_sha256}\n` +
          `업로드한 공개키 해시 : ${uploadedHash}`,
        { status: 400 }
      )
    }

    // 4) 발급 때와 동일한 payload 구성
    const payload = buildCertPayload(cert.username, cert.pubkey_sha256)

    // 5) CA 공개키로 서명 검증
    const ok = crypto.verify(
      'sha256',
      Buffer.from(payload, 'utf8'),
      CA_PUBLIC_KEY,
      Buffer.from(cert.signature, 'base64')
    )

    if (!ok) {
      return new NextResponse('검증 실패: 서명이 올바르지 않습니다.', {
        status: 400,
      })
    }

    return new NextResponse('검증 성공: 유효한 인증서입니다.', { status: 200 })
  } catch (err: unknown) {
    console.error('Verify error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new NextResponse(`인증서 검증 실패: ${msg}`, { status: 500 })
  }
}
