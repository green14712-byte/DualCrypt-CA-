'use client'

import { FormEvent, useState } from 'react'

export default function CAPage() {
  const [registerResult, setRegisterResult] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<string | null>(null)

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setRegisterResult('인증서 발급 요청 중...')

    const formData = new FormData(e.currentTarget)
    const res = await fetch('/api/ca/register', {
      method: 'POST',
      body: formData,
    })

    const text = await res.text()
    setRegisterResult(text)
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setVerifyResult('검증 요청 중...')

    const formData = new FormData(e.currentTarget)
    const res = await fetch('/api/ca/verify', {
      method: 'POST',
      body: formData,
    })

    const text = await res.text()
    setVerifyResult(text)
  }

  return (
    <main className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">DualCrypt CA 서버</h1>
      <p className="text-gray-700">공개키 인증서 발급 및 검증 서비스</p>

      {/* 공개키 등록 + 인증서 발급 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">
          1) 공개키 등록 & 인증서 발급
        </h2>
        <form
          onSubmit={handleRegister}
          className="space-y-4"
          encType="multipart/form-data"
        >
          <div>
            <label>사용자 이름(username)</label>
            <br />
            <input name="username" className="border p-1" required />
          </div>

          <div>
            <label>공개키 파일 (.pub.pem)</label>
            <br />
            <input type="file" name="pubkey" required />
          </div>

          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            인증서 발급 요청
          </button>
        </form>

        {registerResult && (
          <pre className="bg-gray-100 p-2 mt-3 text-sm whitespace-pre-wrap">
            {registerResult}
          </pre>
        )}
      </section>

      <hr />

      {/* 공개키 + 인증서 검증 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">2) 공개키 + 인증서 검증</h2>
        <form
          onSubmit={handleVerify}
          className="space-y-4"
          encType="multipart/form-data"
        >
          <div>
            <label>공개키 파일 (.pub.pem)</label>
            <br />
            <input type="file" name="pubkey" required />
          </div>
          <div>
            <label>인증서 파일 (.cert.json)</label>
            <br />
            <input type="file" name="cert" required />
          </div>

          <button className="px-4 py-2 bg-green-600 text-white rounded">
            검증 요청
          </button>
        </form>

        {verifyResult && (
          <pre className="bg-gray-100 p-2 mt-3 text-sm whitespace-pre-wrap">
            {verifyResult}
          </pre>
        )}
      </section>
    </main>
  )
}
