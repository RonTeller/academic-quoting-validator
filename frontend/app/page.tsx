'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function Home() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const router = useRouter()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file')
      return
    }

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
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Validate Your Paper's Citations
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload an academic paper and we'll analyze each quote to verify it
          accurately represents the source material. Each quote is graded from
          1-100 with a detailed explanation.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-6xl">
            {uploading ? '...' : '...'}
          </div>
          {uploading ? (
            <p className="text-lg text-gray-600">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-lg text-blue-600">Drop the PDF here...</p>
          ) : (
            <>
              <p className="text-lg text-gray-600">
                Drag and drop a PDF here, or click to select
              </p>
              <p className="text-sm text-gray-500">Maximum file size: 50MB</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <input
          type="checkbox"
          id="manualMode"
          checked={manualMode}
          onChange={(e) => setManualMode(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300"
        />
        <label htmlFor="manualMode" className="text-sm text-gray-700">
          Manual mode: I will upload all reference papers myself
        </label>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Upload the paper you want to validate</li>
          <li>Our AI extracts all quotes and citations</li>
          <li>
            {manualMode
              ? 'You upload the reference papers'
              : 'We automatically download reference papers (you can upload any we miss)'}
          </li>
          <li>Each quote is validated against the original source</li>
          <li>View detailed results with grades and explanations</li>
        </ol>
      </div>
    </div>
  )
}
