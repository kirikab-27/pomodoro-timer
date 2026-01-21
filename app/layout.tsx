import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ポモドーロタイマー - 集中力を高める時間管理ツール',
  description: '25分の作業セッションと5分の休憩を交互に繰り返すポモドーロテクニック用タイマー。生産性向上に最適。',
  keywords: ['ポモドーロ', 'タイマー', '時間管理', '生産性', '集中力'],
  authors: [{ name: 'Pomodoro Timer Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          duration={3000}
        />
      </body>
    </html>
  )
}