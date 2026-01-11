'use client'

import { useState } from 'react'
import { Quote } from '@/lib/api'

interface QuoteCardProps {
  quote: Quote
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
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

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export default function QuoteCard({ quote }: QuoteCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getGradeInfo = (grade: number | null) => {
    if (grade === null) return { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Pending', icon: null }
    if (grade >= 90) return { color: 'bg-green-100 text-green-700 border-green-300', label: 'Excellent', icon: <CheckCircleIcon className="w-4 h-4" /> }
    if (grade >= 75) return { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Good', icon: <CheckCircleIcon className="w-4 h-4" /> }
    if (grade >= 60) return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Fair', icon: <AlertCircleIcon className="w-4 h-4" /> }
    if (grade >= 40) return { color: 'bg-orange-100 text-orange-700 border-orange-300', label: 'Poor', icon: <AlertCircleIcon className="w-4 h-4" /> }
    return { color: 'bg-red-100 text-red-700 border-red-300', label: 'Inaccurate', icon: <AlertCircleIcon className="w-4 h-4" /> }
  }

  const gradeInfo = getGradeInfo(quote.grade)

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md">
      {/* Header - Always visible */}
      <button
        className="w-full p-5 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-4">
          {/* Quote info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {quote.reference_key && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                  <FileTextIcon className="w-3 h-3" />
                  {quote.reference_key}
                </span>
              )}
              {quote.page_number && (
                <span className="text-xs text-gray-500">
                  Page {quote.page_number}
                </span>
              )}
            </div>
            <p className="text-gray-900 leading-relaxed line-clamp-2">
              <span className="text-gray-400">"</span>
              {quote.text}
              <span className="text-gray-400">"</span>
            </p>
          </div>

          {/* Grade badge */}
          <div className="flex items-center gap-3">
            <div className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${gradeInfo.color}`}>
              <div className="flex items-center gap-1.5">
                {gradeInfo.icon}
                <span className="text-2xl font-bold">
                  {quote.grade !== null ? quote.grade : '?'}
                </span>
              </div>
              <span className="text-xs font-medium">{gradeInfo.label}</span>
            </div>

            {/* Expand icon */}
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t bg-gray-50 p-5 space-y-5 animate-fadeIn">
          {/* Quote in context */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <MessageSquareIcon className="w-4 h-4" />
              Quote in Paper
            </div>
            <div className="bg-white border rounded-lg p-4 text-gray-800 leading-relaxed">
              {quote.context_before && (
                <span className="text-gray-400">...{quote.context_before} </span>
              )}
              <mark className="bg-yellow-200 px-1 rounded">"{quote.text}"</mark>
              {quote.context_after && (
                <span className="text-gray-400"> {quote.context_after}...</span>
              )}
            </div>
          </div>

          {/* Original source text */}
          {quote.source_text && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileTextIcon className="w-4 h-4" />
                Original Source
                {quote.source_page && (
                  <span className="font-normal text-gray-500">(Page {quote.source_page})</span>
                )}
              </div>
              <div className="bg-white border rounded-lg p-4 text-gray-800 leading-relaxed">
                {quote.source_text}
              </div>
            </div>
          )}

          {/* Analysis explanation */}
          {quote.explanation && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Analysis
              </div>
              <div className="bg-white border rounded-lg p-4 text-gray-700 leading-relaxed">
                {quote.explanation}
              </div>
            </div>
          )}

          {/* Failed status message */}
          {quote.status === 'failed' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Validation Failed</p>
                <p className="text-sm text-red-600 mt-1">
                  {quote.explanation || 'Unable to validate this quote against the source.'}
                </p>
              </div>
            </div>
          )}

          {/* No source found */}
          {!quote.source_text && quote.status !== 'failed' && (
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <AlertCircleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Source Not Found</p>
                <p className="text-sm text-yellow-700 mt-1">
                  The exact source text could not be located in the reference paper.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
