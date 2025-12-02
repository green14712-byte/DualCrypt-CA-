import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const CA_KEY_PATH = path.join(process.cwd(), 'ca', 'rootCA.key')
const ISSUED_DIR = path.join(process.cwd(), 'ca', 'issued')

if (!fs.existsSync(ISSUED_DIR)) {
  fs.mkdirSync(ISSUED_DIR, { recursive: true })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const username = formData.get('username') as string | null
  const pubkeyFile = formData.get('pubkey') as File | null

  if (!username || !pubkeyFile) {
    return new NextResponse('username 또는 공개키가 없습니다.', { status: 400 })
  }

  const pubPem = Buffer.from(await pubkeyFile.arrayBuffer())

  // 1) 공개키 해시 계산
  const hashHex = crypto.createHash('sha256').update(pubPem).digest('hex')

  // 2) CA 개인키 로드
  const caPrivPem = fs.readFileSync(CA_KEY_PATH, 'utf8')
  const caPrivKey = crypto.createPrivateKey(caPrivPem)

  // 3) 공개키에 CA가 서명
  const signature = crypto.sign('sha256', pubPem, caPrivKey)
  const signatureB64 = signature.toString('base64')

  const cert = {
    username,
    pubkey_sha256: hashHex,
    signature: signatureB64,
  }

  const certPath = path.join(ISSUED_DIR, `${username}.cert.json`)
  fs.writeFileSync(certPath, JSON.stringify(cert, null, 2), 'utf8')

  return NextResponse.json(cert)
}
