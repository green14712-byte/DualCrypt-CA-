import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const CA_PEM_PATH = path.join(process.cwd(), 'ca', 'rootCA.pem')

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const pubkeyFile = formData.get('pubkey') as File | null
  const certFile = formData.get('cert') as File | null

  if (!pubkeyFile || !certFile) {
    return new NextResponse('공개키 또는 인증서가 없습니다.', { status: 400 })
  }

  const pubPem = Buffer.from(await pubkeyFile.arrayBuffer())
  const certJson = Buffer.from(await certFile.arrayBuffer()).toString('utf8')

  let cert: any
  try {
    cert = JSON.parse(certJson)
  } catch {
    return new NextResponse('인증서 JSON 파싱 실패', { status: 400 })
  }

  // 1) 공개키 해시 일치 여부 확인
  const hashHex = crypto.createHash('sha256').update(pubPem).digest('hex')
  if (hashHex !== cert.pubkey_sha256) {
    return NextResponse.json({ result: 'FAIL', reason: 'Hash mismatch' })
  }

  // 2) CA 공개키 로드
  const caPubPem = fs.readFileSync(CA_PEM_PATH, 'utf8')
  const caPubKey = crypto.createPublicKey(caPubPem)

  // 3) 서명 검증
  const signature = Buffer.from(cert.signature, 'base64')
  const ok = crypto.verify('sha256', pubPem, caPubKey, signature)

  if (!ok) {
    return NextResponse.json({ result: 'FAIL', reason: 'Bad signature' })
  }

  return NextResponse.json({ result: 'OK', message: '유효한 인증서입니다.' })
}
