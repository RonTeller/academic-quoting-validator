'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
    if (grade === null) return 'bg-gray-100'
    if (grade >= 90) return 'grade-excellent'
    if (grade >= 75) return 'grade-good'
    if (grade >= 60) return 'grade-fair'
    if (grade >= 40) return 'grade-poor'
    return 'grade-failing'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading analysis...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-12 text-gray-600">
        Analysis not found
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {analysis.uploaded_paper?.title || 'Analysis'}
            </h2>
            <p className="text-gray-500 mt-1">
              Analysis #{analysis.id}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(analysis.status)}`}>
            {formatStatus(analysis.status)}
          </div>
        </div>

        {analysis.status_message && (
          <p className="mt-4 text-gray-600">{analysis.status_message}</p>
        )}

        {/* Progress indicator for in-progress statuses */}
        {['pending', 'extracting_quotes', 'fetching_references', 'validating'].includes(analysis.status) && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercent(analysis.status)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Missing papers upload */}
      {analysis.status === 'awaiting_uploads' && missingPapers.length > 0 && (
        <MissingPapersUpload
          analysisId={analysisId}
          missingPapers={missingPapers}
          onUploadComplete={fetchData}
          onContinue={handleContinue}
        />
      )}

      {/* Results */}
      {analysis.status === 'completed' && (
        <>
          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">{quotes.length}</div>
                <div className="text-sm text-gray-500">Total Quotes</div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${getGradeColor(averageGrade)}`}>
                <div className="text-3xl font-bold">
                  {averageGrade ? averageGrade.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm">Average Grade</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-700">
                  {quotes.filter(q => (q.grade ?? 0) >= 75).length}
                </div>
                <div className="text-sm text-green-600">Good Quotes</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-700">
                  {quotes.filter(q => (q.grade ?? 0) < 60).length}
                </div>
                <div className="text-sm text-red-600">Needs Review</div>
              </div>
            </div>
          </div>

          {/* Quote list */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Quotes Analysis</h3>
            {quotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        </>
      )}
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

function getProgressPercent(status: string): number {
  switch (status) {
    case 'pending':
      return 10
    case 'extracting_quotes':
      return 30
    case 'fetching_references':
      return 50
    case 'validating':
      return 80
    default:
      return 0
  }
}
