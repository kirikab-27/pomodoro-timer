'use client'

import { useState } from 'react'
import { X, TrendingUp, Clock, Target, Award } from 'lucide-react'

interface StatisticsProps {
  onClose: () => void
}

interface DailyStats {
  date: string
  sessions: number
  focusMinutes: number
  breakMinutes: number
}

const mockData: DailyStats[] = [
  { date: '月曜日', sessions: 8, focusMinutes: 200, breakMinutes: 40 },
  { date: '火曜日', sessions: 6, focusMinutes: 150, breakMinutes: 30 },
  { date: '水曜日', sessions: 10, focusMinutes: 250, breakMinutes: 50 },
  { date: '木曜日', sessions: 7, focusMinutes: 175, breakMinutes: 35 },
  { date: '金曜日', sessions: 9, focusMinutes: 225, breakMinutes: 45 },
  { date: '土曜日', sessions: 4, focusMinutes: 100, breakMinutes: 20 },
  { date: '日曜日', sessions: 5, focusMinutes: 125, breakMinutes: 25 },
]

export default function Statistics({ onClose }: StatisticsProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')

  const totalSessions = mockData.reduce((acc, day) => acc + day.sessions, 0)
  const totalFocusHours = Math.round(
    mockData.reduce((acc, day) => acc + day.focusMinutes, 0) / 60
  )
  const averageSessions = Math.round(totalSessions / mockData.length)
  const bestDay = mockData.reduce((max, day) =>
    day.sessions > max.sessions ? day : max
  )

  const maxSessions = Math.max(...mockData.map((d) => d.sessions))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          統計
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{totalSessions}</span>
          </div>
          <p className="text-sm opacity-90">総セッション数</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{totalFocusHours}h</span>
          </div>
          <p className="text-sm opacity-90">総集中時間</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{averageSessions}</span>
          </div>
          <p className="text-sm opacity-90">平均セッション/日</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{bestDay.date}</span>
          </div>
          <p className="text-sm opacity-90">最も生産的な日</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            週間レポート
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              週
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              月
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {mockData.map((day, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="w-16 text-sm text-gray-600 dark:text-gray-400">
                {day.date}
              </span>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg transition-all duration-500 ease-out"
                    style={{
                      width: `${(day.sessions / maxSessions) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {day.sessions} セッション
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
          最近のセッション
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              今日 14:30
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              作業 - 25分
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              今日 14:00
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              作業 - 25分
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              今日 13:30
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              休憩 - 5分
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              今日 13:00
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              作業 - 25分
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}