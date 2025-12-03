'use client'

import { FormEvent, useState, useEffect } from 'react'

interface CAInfo {
  subject: {
    commonName: string
    country: string
    state: string
    locality: string
    organization: string
    organizationalUnit: string
  }
  certificate: {
    serialNumber: string
    validFrom: string
    validUntil: string
    publicKeyHash: string
  }
  publicKey: string
}

interface IssuedCert {
  username: string
  pubkey_sha256: string
  signature: string
}

export default function CAPage() {
  const [registerResult, setRegisterResult] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<string | null>(null)
  const [caInfo, setCAInfo] = useState<CAInfo | null>(null)
  const [showCAInfo, setShowCAInfo] = useState(false)
  const [showPublicKey, setShowPublicKey] = useState(false)
  const [issuedCert, setIssuedCert] = useState<IssuedCert | null>(null)

  async function loadCAInfo() {
    try {
      const res = await fetch('/api/ca/info')
      if (res.ok) {
        const data = await res.json()
        setCAInfo(data)
        setShowCAInfo(true)
      }
    } catch (error) {
      console.error('CA 정보 로드 실패:', error)
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setRegisterResult('인증서 발급 요청 중...')
    setIssuedCert(null)

    const formData = new FormData(e.currentTarget)
    const res = await fetch('/api/ca/register', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      try {
        const cert = await res.json()
        setIssuedCert(cert)
        setRegisterResult(
          `✅ 인증서 발급 완료!\n사용자: ${cert.username}\n공개키 해시: ${cert.pubkey_sha256}`
        )
      } catch {
        const text = await res.text()
        setRegisterResult(text)
      }
    } else {
      const text = await res.text()
      setRegisterResult(text)
    }
  }

  function downloadCertificate() {
    if (!issuedCert) return

    const certJson = JSON.stringify(issuedCert, null, 2)
    const blob = new Blob([certJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${issuedCert.username}.cert.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function downloadCAPublicKey() {
    if (!caInfo) return

    const blob = new Blob([caInfo.publicKey], {
      type: 'application/x-pem-file',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rootCA.pub.pem'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
    const cleaned = text.trim()

    // 서버가 빈 문자열을 보내는 경우 대비
    if (!cleaned) {
      setVerifyResult(
        res.ok
          ? '✅ 검증 성공했지만 서버에서 메시지를 보내지 않았습니다.'
          : '❌ 검증 실패 (서버로부터 빈 응답)'
      )
      return
    }
    setVerifyResult(cleaned)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-linear-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <svg
                className="w-8 h-8 text-blue-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                DualCrypt 공인인증기관
              </h1>
              <p className="text-blue-200 text-sm mt-1 font-medium">
                Ministry of Digital Security & Certification Authority
              </p>
            </div>
          </div>
          <p className="text-blue-100 text-base pl-18">
            공개키 기반 전자인증서 발급 및 검증 서비스
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Info Banner with CA Info Button */}
        <div className="bg-blue-50 border-l-4 border-blue-600 px-6 py-4 mb-8 rounded-r-lg shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <svg
                className="w-6 h-6 text-blue-600 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  전자인증서비스 안내
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  본 서비스는 공개키 암호화 기술을 기반으로 한 전자인증서 발급
                  및 검증 시스템입니다. 안전한 디지털 신원 확인을 위해 최신
                  암호화 알고리즘을 적용하고 있습니다.
                </p>
              </div>
            </div>
            <button
              onClick={loadCAInfo}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              CA 루트 인증서 정보
            </button>
          </div>
        </div>

        {/* CA Info Modal/Section */}
        {showCAInfo && caInfo && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl border-2 border-indigo-200 overflow-hidden">
            <div className="bg-linear-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">
                  CA 루트 인증서 정보
                </h2>
              </div>
              <button
                onClick={() => setShowCAInfo(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Subject Information */}
              <div>
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  주체 정보 (Subject)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      Common Name:
                    </span>
                    <p className="text-slate-900 font-medium mt-1">
                      {caInfo.subject.commonName}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      Country:
                    </span>
                    <p className="text-slate-900 font-medium mt-1">
                      {caInfo.subject.country}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      State:
                    </span>
                    <p className="text-slate-900 font-medium mt-1">
                      {caInfo.subject.state}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      Locality:
                    </span>
                    <p className="text-slate-900 font-medium mt-1">
                      {caInfo.subject.locality}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      Organization:
                    </span>
                    <p className="text-slate-900 font-medium mt-1">
                      {caInfo.subject.organization}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      Organizational Unit:
                    </span>
                    <p className="text-slate-900 font-medium mt-1">
                      {caInfo.subject.organizationalUnit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Information */}
              <div>
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  인증서 정보
                </h3>
                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      Serial Number:
                    </span>
                    <p className="text-slate-900 font-mono mt-1">
                      {caInfo.certificate.serialNumber}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      유효 시작:
                    </span>
                    <p className="text-slate-900 mt-1">
                      {caInfo.certificate.validFrom}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      유효 만료:
                    </span>
                    <p className="text-slate-900 mt-1">
                      {caInfo.certificate.validUntil}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">
                      Public Key Hash (SHA-256):
                    </span>
                    <p className="text-slate-900 font-mono text-xs mt-1 break-all">
                      {caInfo.certificate.publicKeyHash}
                    </p>
                  </div>
                </div>
              </div>

              {/* Public Key */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    공개키
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadCAPublicKey}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      다운로드
                    </button>
                    <button
                      onClick={() => setShowPublicKey(!showPublicKey)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1"
                    >
                      {showPublicKey ? '숨기기' : '보기'}
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          showPublicKey ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {showPublicKey && (
                  <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto border border-slate-700">
                    {caInfo.publicKey}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 인증서 발급 섹션 */}
          <section className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    전자인증서 발급
                  </h2>
                  <p className="text-blue-100 text-sm">Certificate Issuance</p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleRegister}
              className="p-6 space-y-5"
              encType="multipart/form-data"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  신청인 성명 <span className="text-red-500">*</span>
                </label>
                <input
                  name="username"
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="홍길동"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  실명을 정확히 입력해주세요
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  공개키 파일 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    name="pubkey"
                    accept=".pem,.pub"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100 cursor-pointer transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  허용 형식: .pub.pem
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                인증서 발급 신청
              </button>

              {registerResult && (
                <div className="mt-4 bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-slate-600 shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">
                      처리 결과
                    </span>
                  </div>
                  <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-slate-200 overflow-x-auto">
                    {registerResult}
                  </pre>

                  {issuedCert && (
                    <button
                      onClick={downloadCertificate}
                      className="mt-4 w-full bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      인증서 다운로드 ({issuedCert.username}.cert.json)
                    </button>
                  )}
                </div>
              )}
            </form>
          </section>

          {/* 인증서 검증 섹션 */}
          <section className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-linear-to-r from-teal-600 to-teal-700 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">인증서 검증</h2>
                  <p className="text-teal-100 text-sm">
                    Certificate Verification
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleVerify}
              className="p-6 space-y-5"
              encType="multipart/form-data"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  공개키 파일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="pubkey"
                  accept=".pem,.pub"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-teal-50 file:text-teal-700 file:font-semibold hover:file:bg-teal-100 cursor-pointer transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  허용 형식: .pub.pem
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  인증서 파일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="cert"
                  accept=".json,.cert"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-teal-50 file:text-teal-700 file:font-semibold hover:file:bg-teal-100 cursor-pointer transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  허용 형식: .cert.json
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-linear-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                인증서 검증 요청
              </button>

              {verifyResult && (
                <div className="mt-4 bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-slate-600 shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">
                      검증 결과
                    </span>
                  </div>
                  <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-slate-200 overflow-x-auto">
                    {verifyResult}
                  </pre>
                </div>
              )}
            </form>
          </section>
        </div>

        {/* Footer Info */}
        <footer className="mt-12 bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                보안 정책
              </h3>
              <p className="text-gray-600 leading-relaxed">
                모든 인증서는 SHA-256 해시 알고리즘으로 보호됩니다.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                운영 시간
              </h3>
              <p className="text-gray-600 leading-relaxed">
                24시간 365일 무중단 서비스
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                문의
              </h3>
              <p className="text-gray-600 leading-relaxed">
                dbxorkd1002@naver.com
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-gray-500 text-xs">
            © 2025 DualCrypt Certificate Authority. All rights reserved. |
            사업자등록번호: 000-00-00000
          </div>
        </footer>
      </main>
    </div>
  )
}
