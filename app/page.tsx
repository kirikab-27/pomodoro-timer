'use client'

import { useState } from 'react'
import Timer from '@/components/Timer'
import Settings from '@/components/Settings'
import Statistics from '@/components/Statistics'
import { Moon, Sun, Settings as SettingsIcon, BarChart3 } from 'lucide-react'

export default function Home() {
  const [darkMode, setDarkMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (!darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            ポモドーロタイマー
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
              aria-label="統計"
            >
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
              aria-label="設定"
            >
              <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
              aria-label="テーマ切り替え"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          {showSettings ? (
            <Settings onClose={() => setShowSettings(false)} />
          ) : showStatistics ? (
            <Statistics onClose={() => setShowStatistics(false)} />
          ) : (
            <Timer />
          )}
        </main>

        <footer className="text-center mt-16 text-sm text-gray-600 dark:text-gray-400">
          <p>集中力を高めるポモドーロテクニック</p>
          <p className="mt-2">25分の作業 → 5分の休憩 → 繰り返し</p>
        </footer>
      </div>
    </div>
  )
}