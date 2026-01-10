import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Types
export interface Analysis {
  id: number
  status: string
  status_message: string | null
  created_at: string
  updated_at: string | null
  uploaded_paper: Paper | null
}

export interface Paper {
  id: number
  title: string | null
  authors: string | null
  year: number | null
  doi: string | null
  source_type: string
  reference_key: string | null
}

export interface Quote {
  id: number
  text: string
  page_number: number | null
  context_before: string | null
  context_after: string | null
  reference_key: string | null
  status: string
  grade: number | null
  explanation: string | null
  source_text: string | null
  source_page: number | null
}

export interface QuotesResponse {
  quotes: Quote[]
  total: number
  average_grade: number | null
}

export interface MissingPaper {
  reference_key: string
  reference_text: string | null
  title: string | null
  doi: string | null
}

// API functions
export async function getAnalysis(id: number): Promise<Analysis> {
  const response = await api.get(`/api/analysis/${id}`)
  return response.data
}

export async function getQuotes(analysisId: number): Promise<QuotesResponse> {
  const response = await api.get(`/api/quotes/analysis/${analysisId}`)
  return response.data
}

export async function getMissingPapers(analysisId: number): Promise<{ missing_papers: MissingPaper[] }> {
  const response = await api.get(`/api/analysis/${analysisId}/missing-papers`)
  return response.data
}

export async function uploadReferencePaper(
  analysisId: number,
  file: File,
  referenceKey: string
): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('reference_key', referenceKey)
  await api.post(`/api/analysis/${analysisId}/papers`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export async function continueAnalysis(analysisId: number): Promise<void> {
  await api.post(`/api/analysis/${analysisId}/continue`)
}
