'use client'

import { useState } from 'react'
import { Quote } from '@/lib/api'

interface QuoteCardProps {
  quote: Quote
}

export default function QuoteCard({ quote }: QuoteCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'bg-gray-100 text-gray-800 border-gray-300'
    if (grade >= 90) return 'bg-green-100 text-green-800 border-green-300'
    if (grade >= 75) return 'bg-blue-100 text-blue-800 border-blue-300'
    if (grade >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (grade >= 40) return 'bg-orange-100 text-orange-800 border-orange-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  const getGradeLabel = (grade: number | null) => {
    if (grade === null) return 'Pending'
    if (grade >= 90) return 'Excellent'
    if (grade >= 75) return 'Good'
    if (grade >= 60) return 'Fair'
    if (grade >= 40) return 'Poor'
    return 'Inaccurate'
  }

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {quote.reference_key && (
                <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                  {quote.reference_key}
                </span>
              )}
              {quote.page_number && (
                <span className="text-xs text-gray-500">
                  Page {quote.page_number}
                </span>
              )}
            </div>
            <p className="text-gray-900 line-clamp-2">
              "{quote.text}"
            </p>
          </div>
          <div className={`flex-shrink-0 px-3 py-2 rounded-lg border text-center min-w-[80px] ${getGradeColor(quote.grade)}`}>
            <div className="text-2xl font-bold">
              {quote.grade !== null ? quote.grade : '?'}
            </div>
            <div className="text-xs">{getGradeLabel(quote.grade)}</div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t bg-gray-50 p-4 space-y-4">
          {/* Full quote */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Quote in Paper</h4>
            <div className="bg-white border rounded p-3 text-gray-800">
              {quote.context_before && (
                <span className="text-gray-400">...{quote.context_before} </span>
              )}
              <span className="bg-yellow-100 px-1">"{quote.text}"</span>
              {quote.context_after && (
                <span className="text-gray-400"> {quote.context_after}...</span>
              )}
            </div>
          </div>

          {/* Source text */}
          {quote.source_text && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                Original Source
                {quote.source_page && <span className="text-gray-500"> (Page {quote.source_page})</span>}
              </h4>
              <div className="bg-white border rounded p-3 text-gray-800">
                {quote.source_text}
              </div>
            </div>
          )}

          {/* Explanation */}
          {quote.explanation && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Analysis</h4>
              <div className="bg-white border rounded p-3 text-gray-700">
                {quote.explanation}
              </div>
            </div>
          )}

          {/* Status */}
          {quote.status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
              Failed to validate this quote: {quote.explanation || 'Unknown error'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
