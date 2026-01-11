'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getAnalysis,
  getQuotes,
  getMissingPapers,
  continueAnalysis,
  Analysis,
  Quote,
  MissingPaper,
} from '@/lib/api'
import QuoteCard from '@/components/QuoteCard'
import MissingPapersUpload from '@/components/MissingPapersUpload'

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

const PROCESSING_STEPS = [
  { key: 'pending', label: 'Starting', description: 'Initializing analysis...' },
  { key: 'extracting_quotes', label: 'Extracting', description: 'Finding quotes and citations...' },
  { key: 'fetching_references', label: 'Fetching', description: 'Downloading reference papers...' },
  { key: 'validating', label: 'Validating', description: 'Verifying quotes against sources...' },
]

export default function AnalysisPage() {
  const params = useParams()
  const analysisId = Number(params.id)

  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [missingPapers, setMissingPapers] = useState<MissingPaper[]>([])
  const [averageGrade, setAverageGrade] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const analysisData = await getAnalysis(analysisId)
      setAnalysis(analysisData)

      if (analysisData.status === 'awaiting_uploads') {
        const { missing_papers } = await getMissingPapers(analysisId)
        setMissingPapers(missing_papers)
      }

      if (analysisData.status === 'completed') {
        const quotesData = await getQuotes(analysisId)
        setQuotes(quotesData.quotes)
        setAverageGrade(quotesData.average_grade)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Poll for updates if analysis is in progress
    const interval = setInterval(() => {
      if (analysis && !['completed', 'failed', 'awaiting_uploads'].includes(analysis.status)) {
        fetchData()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [analysisId, analysis?.status])

  const handleContinue = async () => {
    try {
      await continueAnalysis(analysisId)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to continue analysis')
    }
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'bg-gray-100 border-gray-200'
    if (grade >= 90) return 'bg-green-100 border-green-300 text-green-800'
    if (grade >= 75) return 'bg-blue-100 border-blue-300 text-blue-800'
    if (grade >= 60) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    if (grade >= 40) return 'bg-orange-100 border-orange-300 text-orange-800'
    return 'bg-red-100 border-red-300 text-red-800'
  }

  const getGradeLabel = (grade: number | null) => {
    if (grade === null) return 'Pending'
    if (grade >= 90) return 'Excellent'
    if (grade >= 75) return 'Good'
    if (grade >= 60) return 'Fair'
    if (grade >= 40) return 'Poor'
    return 'Needs Review'
  }

  const getCurrentStepIndex = () => {
    return PROCESSING_STEPS.findIndex(step => step.key === analysis?.status)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <SpinnerIcon className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg text-gray-600">Loading analysis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Analysis</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Not Found</h3>
        <p className="text-gray-600 mb-4">The analysis you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    )
  }

  const isProcessing = ['pending', 'extracting_quotes', 'fetching_references', 'validating'].includes(analysis.status)
  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>New Analysis</span>
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {analysis.uploaded_paper?.title || 'Untitled Analysis'}
            </h2>
            <p className="text-gray-500 mt-1">
              Analysis #{analysis.id} • Created {new Date(analysis.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(analysis.status)}`}>
            {formatStatus(analysis.status)}
          </div>
        </div>

        {analysis.status_message && (
          <p className="mt-4 text-gray-600 bg-gray-50 rounded-lg p-3">{analysis.status_message}</p>
        )}
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <SpinnerIcon className="w-6 h-6 text-blue-500 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900">Processing Your Paper</h3>
          </div>

          <div className="space-y-4">
            {PROCESSING_STEPS.map((step, index) => {
              const isActive = index === currentStepIndex
              const isComplete = index < currentStepIndex
              const isPending = index > currentStepIndex

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    isActive ? 'bg-blue-50 border border-blue-200' :
                    isComplete ? 'bg-green-50 border border-green-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-blue-500' :
                    isComplete ? 'bg-green-500' :
                    'bg-gray-300'
                  }`}>
                    {isComplete ? (
                      <CheckIcon className="w-5 h-5 text-white" />
                    ) : isActive ? (
                      <SpinnerIcon className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <span className="text-white font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${
                      isActive ? 'text-blue-900' :
                      isComplete ? 'text-green-900' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    <p className={`text-sm ${
                      isActive ? 'text-blue-700' :
                      isComplete ? 'text-green-700' :
                      'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            This may take a few minutes depending on the number of references...
          </p>
        </div>
      )}

      {/* Missing papers upload */}
      {analysis.status === 'awaiting_uploads' && missingPapers.length > 0 && (
        <MissingPapersUpload
          analysisId={analysisId}
          missingPapers={missingPapers}
          onUploadComplete={fetchData}
          onContinue={handleContinue}
        />
      )}

      {/* Failed Status */}
      {analysis.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <svg className="w-8 h-8 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Analysis Failed</h3>
              <p className="text-red-600 mt-1">
                {analysis.status_message || 'An error occurred while processing your paper.'}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {analysis.status === 'completed' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label="Total Quotes"
              value={quotes.length}
              className="bg-white"
            />
            <SummaryCard
              label="Average Grade"
              value={averageGrade ? averageGrade.toFixed(0) : 'N/A'}
              sublabel={getGradeLabel(averageGrade)}
              className={getGradeColor(averageGrade)}
            />
            <SummaryCard
              label="Good Quotes"
              value={quotes.filter(q => (q.grade ?? 0) >= 75).length}
              icon={<CheckIcon className="w-5 h-5 text-green-600" />}
              className="bg-green-50 border-green-200"
            />
            <SummaryCard
              label="Needs Review"
              value={quotes.filter(q => (q.grade ?? 100) < 60).length}
              icon={
                <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
              className="bg-red-50 border-red-200"
            />
          </div>

          {/* Quote List Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Quote Analysis</h3>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {/* TODO: Implement export */}}
            >
              <DownloadIcon className="w-4 h-4" />
              Export Results
            </button>
          </div>

          {/* Quote Cards */}
          {quotes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-gray-500">No quotes found in this paper.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <QuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sublabel,
  icon,
  className = ''
}: {
  label: string
  value: string | number
  sublabel?: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${className}`}>
      {icon && <div className="mb-2">{icon}</div>}
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      {sublabel && <div className="text-xs opacity-75">{sublabel}</div>}
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'awaiting_uploads':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
