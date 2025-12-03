import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const CA_KEY_PATH = path.join(process.cwd(), 'ca', 'rootCA.key')
const CA_PUB_PATH = path.join(process.cwd(), 'ca', 'rootCA.pub.pem')

export async function GET() {
  try {
    // CA 개인키에서 공개키 추출 (공개키 파일이 없는 경우 대비)
    let caPubPem: string

    if (fs.existsSync(CA_PUB_PATH)) {
      caPubPem = fs.readFileSync(CA_PUB_PATH, 'utf8')
    } else {
      const caPrivPem = fs.readFileSync(CA_KEY_PATH, 'utf8')
      const caPrivKey = crypto.createPrivateKey(caPrivPem)
      const caPubKey = crypto.createPublicKey(caPrivKey)
      caPubPem = caPubKey.export({ type: 'spki', format: 'pem' }) as string

      // 공개키 파일 저장
      fs.writeFileSync(CA_PUB_PATH, caPubPem, 'utf8')
    }

    // 공개키 해시 계산
    const pubkeyHash = crypto
      .createHash('sha256')
      .update(Buffer.from(caPubPem))
      .digest('hex')

    // CA 인증서 정보 생성
    const caInfo = {
      subject: {
        commonName: 'DualCrypt Root Certificate Authority',
        country: 'KR',
        state: 'N/A',
        locality: 'Seoul',
        organization: 'DualCrypt Organization',
        organizationalUnit: 'Certificate Authority',
      },
      certificate: {
        serialNumber: '01',
        validFrom: '2025. 12. 2. 오후 3:51:20',
        validUntil: '2035. 12. 2. 오후 3:51:20',
        publicKeyHash: pubkeyHash,
      },
      publicKey: caPubPem,
    }

    return NextResponse.json(caInfo)
  } catch (error) {
    console.error('CA 정보 조회 오류:', error)
    return new NextResponse('CA 정보를 조회할 수 없습니다.', { status: 500 })
  }
}
