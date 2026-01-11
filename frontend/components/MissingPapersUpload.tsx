'use client'

import { useState } from 'react'
import { MissingPaper, uploadReferencePaper } from '@/lib/api'

interface MissingPapersUploadProps {
  analysisId: number
  missingPapers: MissingPaper[]
  onUploadComplete: () => void
  onContinue: () => void
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
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
  const uploadedCount = uploadedKeys.size
  const totalCount = missingPapers.length
  const progressPercent = (uploadedCount / totalCount) * 100

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangleIcon className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-900">
            Reference Papers Needed
          </h3>
          <p className="text-amber-700 mt-1">
            We couldn't automatically download the following papers. Please upload them
            manually to continue the analysis.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-amber-800">Upload Progress</span>
          <span className="text-amber-700">{uploadedCount} of {totalCount} papers</span>
        </div>
        <div className="w-full bg-amber-200 rounded-full h-2">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Paper list */}
      <div className="space-y-3 mb-6">
        {missingPapers.map((paper) => {
          const isUploaded = uploadedKeys.has(paper.reference_key)
          const isUploading = uploading === paper.reference_key

          return (
            <div
              key={paper.reference_key}
              className={`bg-white rounded-lg border p-4 transition-all ${
                isUploaded
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                      <FileTextIcon className="w-4 h-4 text-gray-500" />
                      {paper.reference_key}
                    </span>
                    {isUploaded && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <CheckIcon className="w-3 h-3" />
                        Uploaded
                      </span>
                    )}
                  </div>
                  {paper.title && (
                    <p className="text-gray-700 font-medium">{paper.title}</p>
                  )}
                  {paper.reference_text && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {paper.reference_text}
                    </p>
                  )}
                  {paper.doi && (
                    <p className="text-xs text-blue-600 mt-2">
                      DOI: {paper.doi}
                    </p>
                  )}
                </div>

                {/* Upload button */}
                {!isUploaded && (
                  <label className="flex-shrink-0 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(paper.reference_key, file)
                        }
                      }}
                    />
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isUploading
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <SpinnerIcon className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <UploadIcon className="w-4 h-4" />
                          Upload PDF
                        </>
                      )}
                    </span>
                  </label>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-amber-200">
        <p className="text-sm text-amber-700">
          {remainingPapers.length > 0 && uploadedCount > 0 && (
            <>Quotes referencing missing papers will be marked as unable to validate.</>
          )}
          {remainingPapers.length === 0 && (
            <>All papers uploaded! Click continue to validate quotes.</>
          )}
        </p>
        <button
          onClick={onContinue}
          disabled={uploadedCount === 0}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            uploadedCount === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow'
          }`}
        >
          {remainingPapers.length === 0 ? (
            <>
              Continue Analysis
              <ArrowRightIcon className="w-4 h-4" />
            </>
          ) : (
            <>
              Continue with {uploadedCount} {uploadedCount === 1 ? 'paper' : 'papers'}
              <ArrowRightIcon className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
