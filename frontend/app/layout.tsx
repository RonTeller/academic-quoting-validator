import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Academic Quoting Validator',
  description: 'Validate if academic papers correctly quote their references',
}

function BookCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="m9 9.5 2 2 4-4" />
    </svg>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity">
              <BookCheckIcon className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">
                  Academic Quoting Validator
                </h1>
                <p className="text-xs text-blue-100">
                  Verify citation accuracy with AI
                </p>
              </div>
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t bg-gray-50 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              Powered by AI. Always verify important citations manually.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
