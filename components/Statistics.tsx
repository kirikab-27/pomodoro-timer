'use client'

import { useState, useEffect } from 'react'
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

interface Session {
  id: string
  type: string
  durationMinutes: number
  startedAt: string
  completedAt: string | null
  isCompleted: boolean
}

export default function Statistics({ onClose }: StatisticsProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()

      if (data.sessions && data.sessions.length > 0) {
        // Group sessions by day and calculate stats
        const statsMap = new Map<string, DailyStats>()
        const today = new Date()
        const weekDays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(today.getDate() - i)
          const dayName = weekDays[date.getDay()]
          statsMap.set(dayName, {
            date: dayName,
            sessions: 0,
            focusMinutes: 0,
            breakMinutes: 0
          })
        }

        // Aggregate session data
        data.sessions.forEach((session: Session) => {
          if (session.isCompleted && session.completedAt) {
            const sessionDate = new Date(session.completedAt)
            const dayName = weekDays[sessionDate.getDay()]
            const stats = statsMap.get(dayName)

            if (stats) {
              stats.sessions++
              if (session.type === 'work') {
                stats.focusMinutes += session.durationMinutes
              } else {
                stats.breakMinutes += session.durationMinutes
              }
            }
          }
        })

        setDailyStats(Array.from(statsMap.values()))
        setRecentSessions(data.sessions.slice(0, 5))
      } else {
        // No data, set empty arrays
        setDailyStats([])
        setRecentSessions([])
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
      setDailyStats([])
      setRecentSessions([])
    } finally {
      setLoading(false)
    }
  }

  const totalSessions = dailyStats.reduce((acc, day) => acc + day.sessions, 0)
  const totalFocusHours = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((acc, day) => acc + day.focusMinutes, 0) / 60)
    : 0
  const averageSessions = dailyStats.length > 0
    ? Math.round(totalSessions / dailyStats.length)
    : 0
  const bestDay = dailyStats.length > 0
    ? dailyStats.reduce((max, day) => day.sessions > max.sessions ? day : max)
    : { date: '-', sessions: 0, focusMinutes: 0, breakMinutes: 0 }

  const maxSessions = dailyStats.length > 0
    ? Math.max(...dailyStats.map((d) => d.sessions))
    : 1

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

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : dailyStats.length > 0 ? (
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
            {dailyStats.map((day, index) => (
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
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            まだデータがありません。
            <br />
            タイマーを使い始めると、ここに統計が表示されます。
          </p>
        </div>
      )}

      {recentSessions.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
            最近のセッション
          </h3>
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const sessionDate = new Date(session.completedAt || session.startedAt)
              const timeStr = sessionDate.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
              })
              const dateStr = sessionDate.toLocaleDateString('ja-JP', {
                month: 'numeric',
                day: 'numeric'
              })
              const typeLabel = session.type === 'work' ? '作業' :
                               session.type === 'shortBreak' ? '短い休憩' : '長い休憩'

              return (
                <div key={session.id} className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {dateStr} {timeStr}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {typeLabel} - {session.durationMinutes}分
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}