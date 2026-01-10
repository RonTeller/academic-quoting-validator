'use client'

import { useState } from 'react'
import { MissingPaper, uploadReferencePaper } from '@/lib/api'

interface MissingPapersUploadProps {
  analysisId: number
  missingPapers: MissingPaper[]
  onUploadComplete: () => void
  onContinue: () => void
}

export default function MissingPapersUpload({
  analysisId,
  missingPapers,
  onUploadComplete,
  onContinue,
}: MissingPapersUploadProps) {
  const [uploadedKeys, setUploadedKeys] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (referenceKey: string, file: File) => {
    setUploading(referenceKey)
    setError(null)

    try {
      await uploadReferencePaper(analysisId, file, referenceKey)
      setUploadedKeys(prev => new Set([...prev, referenceKey]))
      onUploadComplete()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload file')
    } finally {
      setUploading(null)
    }
  }

  const remainingPapers = missingPapers.filter(p => !uploadedKeys.has(p.reference_key))

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        Reference Papers Needed
      </h3>
      <p className="text-yellow-700 mb-4">
        We couldn't automatically download the following papers. Please upload them
        manually to continue the analysis.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {missingPapers.map((paper) => (
          <div
            key={paper.reference_key}
            className={`bg-white rounded-lg border p-4 ${
              uploadedKeys.has(paper.reference_key)
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {paper.reference_key}
                  </span>
                  {uploadedKeys.has(paper.reference_key) && (
                    <span className="text-green-600 text-sm">Uploaded</span>
                  )}
                </div>
                {paper.title && (
                  <p className="text-gray-700 mt-1">{paper.title}</p>
                )}
                {paper.reference_text && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {paper.reference_text}
                  </p>
                )}
                {paper.doi && (
                  <p className="text-xs text-blue-600 mt-1">DOI: {paper.doi}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {!uploadedKeys.has(paper.reference_key) && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(paper.reference_key, file)
                        }
                      }}
                    />
                    <span
                      className={`inline-block px-4 py-2 rounded-lg text-sm font-medium
                        ${uploading === paper.reference_key
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-blue-600 text-white hover:bg-blue-700'}
                      `}
                    >
                      {uploading === paper.reference_key ? 'Uploading...' : 'Upload PDF'}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {uploadedKeys.size} of {missingPapers.length} papers uploaded
        </p>
        <button
          onClick={onContinue}
          disabled={remainingPapers.length === missingPapers.length}
          className={`px-6 py-2 rounded-lg font-medium
            ${remainingPapers.length === missingPapers.length
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'}
          `}
        >
          {remainingPapers.length === 0
            ? 'Continue Analysis'
            : `Continue with ${uploadedKeys.size} papers`}
        </button>
      </div>

      {remainingPapers.length > 0 && uploadedKeys.size > 0 && (
        <p className="mt-2 text-sm text-yellow-700">
          Note: Quotes referencing papers that aren't uploaded will be marked as unable to validate.
        </p>
      )}
    </div>
  )
}
