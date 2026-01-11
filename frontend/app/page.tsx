'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function Home() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const router = useRouter()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file')
      return
    }

    setFileName(file.name)
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('manual_mode', String(manualMode))

      const response = await api.post('/api/analysis/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      router.push(`/analysis/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload file')
      setFileName(null)
    } finally {
      setUploading(false)
    }
  }, [manualMode, router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Validate Your Paper's Citations
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload an academic paper and our AI will analyze each quote to verify it
          accurately represents the source material. Each quote is graded from
          1-100 with a detailed explanation.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
          ${uploading ? 'opacity-75 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          {uploading ? (
            <>
              <div className="flex justify-center">
                <SpinnerIcon className="w-16 h-16 text-blue-500 animate-spin" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">Uploading...</p>
                {fileName && (
                  <p className="text-sm text-gray-500 mt-1">{fileName}</p>
                )}
              </div>
            </>
          ) : isDragActive ? (
            <>
              <div className="flex justify-center">
                <DocumentIcon className="w-16 h-16 text-blue-500" />
              </div>
              <p className="text-lg font-medium text-blue-600">Drop the PDF here...</p>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <UploadIcon className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-white">
                    <DocumentIcon className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drag and drop your PDF here
                </p>
                <p className="text-gray-500 mt-1">
                  or <span className="text-blue-600 font-medium">browse</span> to select a file
                </p>
              </div>
              <p className="text-sm text-gray-400">Maximum file size: 50MB</p>
            </>
          )}
        </div>
      </div>

      {/* Manual Mode Toggle */}
      <div className="flex items-center justify-center">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={manualMode}
              onChange={(e) => setManualMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </div>
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
            Manual mode: I will upload all reference papers myself
          </span>
        </label>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
        <h3 className="font-bold text-gray-900 text-xl mb-6 text-center">How it works</h3>
        <div className="grid md:grid-cols-5 gap-4">
          <Step
            number={1}
            icon={<UploadIcon className="w-6 h-6" />}
            title="Upload"
            description="Upload the paper you want to validate"
          />
          <Step
            number={2}
            icon={<QuoteIcon className="w-5 h-5" />}
            title="Extract"
            description="AI extracts all quotes and citations"
          />
          <Step
            number={3}
            icon={<SearchIcon className="w-6 h-6" />}
            title="Fetch"
            description={manualMode
              ? "You upload the reference papers"
              : "We download reference papers automatically"}
          />
          <Step
            number={4}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            title="Validate"
            description="Each quote is verified against the source"
          />
          <Step
            number={5}
            icon={<StarIcon className="w-6 h-6" />}
            title="Results"
            description="View grades and detailed explanations"
          />
        </div>
      </div>
    </div>
  )
}

function Step({
  number,
  icon,
  title,
  description
}: {
  number: number
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center p-4">
      <div className="relative mb-3">
        <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
