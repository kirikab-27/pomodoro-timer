'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, TreePine } from 'lucide-react'
import { toast } from 'sonner'

type SessionType = 'work' | 'shortBreak' | 'longBreak'

interface Session {
  type: SessionType
  duration: number
  name: string
  icon: React.ReactNode
  color: string
}

interface TimerSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  notificationSound: string
  notificationVolume: number
  dailyGoal: number
}

const getSettings = (): TimerSettings => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pomodoroSettings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // デフォルト値を返す
      }
    }
  }
  return {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    notificationSound: 'default',
    notificationVolume: 70,
    dailyGoal: 8,
  }
}

const createSessions = (settings: TimerSettings): Record<SessionType, Session> => ({
  work: {
    type: 'work',
    duration: settings.workDuration * 60,
    name: '作業',
    icon: <Brain className="w-8 h-8" />,
    color: 'from-red-500 to-rose-500',
  },
  shortBreak: {
    type: 'shortBreak',
    duration: settings.shortBreakDuration * 60,
    name: '短い休憩',
    icon: <Coffee className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-500',
  },
  longBreak: {
    type: 'longBreak',
    duration: settings.longBreakDuration * 60,
    name: '長い休憩',
    icon: <TreePine className="w-8 h-8" />,
    color: 'from-blue-500 to-cyan-500',
  },
})

export default function Timer() {
  const [settings, setSettings] = useState<TimerSettings>(getSettings)
  const [sessions, setSessions] = useState(() => createSessions(settings))
  const [currentSession, setCurrentSession] = useState<SessionType>('work')
  const [timeLeft, setTimeLeft] = useState(sessions.work.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(settings.sessionsUntilLongBreak)

  // 通知権限をリクエスト
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // localStorageの変更を監視して設定を更新
  useEffect(() => {
    const handleStorageChange = () => {
      const newSettings = getSettings()
      setSettings(newSettings)
      const newSessions = createSessions(newSettings)
      setSessions(newSessions)
      setSessionsUntilLongBreak(newSettings.sessionsUntilLongBreak)
      // 現在のセッションの時間を更新（実行中でない場合のみ）
      if (!isRunning) {
        setTimeLeft(newSessions[currentSession].duration)
      }
    }

    // storage イベントを監視（他のタブからの変更を検知）
    window.addEventListener('storage', handleStorageChange)

    // カスタムイベントを監視（同じタブからの変更を検知）
    window.addEventListener('pomodoroSettingsChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('pomodoroSettingsChanged', handleStorageChange)
    }
  }, [currentSession, isRunning])

  const session = sessions[currentSession]
  const progress = ((session.duration - timeLeft) / session.duration) * 100

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const handleComplete = useCallback(() => {
    // 通知音を再生（Web Audio APIを使用）
    const playNotificationSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const duration = 0.3
        const frequency = 800

        // オシレーターを作成
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // 音の設定
        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        // 音量の設定（フェードアウト効果）
        const volume = settings.notificationVolume / 100
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

        // 音を再生
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)

        // 2回目の音（少し遅れて）
        setTimeout(() => {
          const oscillator2 = audioContext.createOscillator()
          const gainNode2 = audioContext.createGain()

          oscillator2.connect(gainNode2)
          gainNode2.connect(audioContext.destination)

          oscillator2.frequency.value = frequency * 1.25
          oscillator2.type = 'sine'

          gainNode2.gain.setValueAtTime(volume * 0.8, audioContext.currentTime)
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

          oscillator2.start(audioContext.currentTime)
          oscillator2.stop(audioContext.currentTime + duration)
        }, 150)

      } catch (error) {
        console.error('通知音の再生に失敗しました:', error)
      }
    }

    playNotificationSound()

    // ブラウザ通知を表示
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ポモドーロタイマー', {
        body: currentSession === 'work' ? '作業完了！休憩しましょう' : '休憩終了！作業を始めましょう',
        icon: '/favicon.ico',
      })
    }

    if (currentSession === 'work') {
      const newSessionCount = sessionCount + 1
      setSessionCount(newSessionCount)
      setTotalSessions(totalSessions + 1)

      if (newSessionCount >= sessionsUntilLongBreak) {
        toast.success('お疲れ様でした！長い休憩を取りましょう')
        setCurrentSession('longBreak')
        setTimeLeft(sessions.longBreak.duration)
        setSessionCount(0)
      } else {
        toast.success('作業お疲れ様！短い休憩を取りましょう')
        setCurrentSession('shortBreak')
        setTimeLeft(sessions.shortBreak.duration)
      }
    } else {
      toast.info('休憩終了！次の作業を始めましょう')
      setCurrentSession('work')
      setTimeLeft(sessions.work.duration)
    }
    setIsRunning(false)
  }, [currentSession, sessionCount, totalSessions, sessions, sessionsUntilLongBreak, settings])

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleComplete()
    }
  }, [timeLeft, isRunning, handleComplete])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(session.duration)
  }

  const switchSession = (type: SessionType) => {
    setIsRunning(false)
    setCurrentSession(type)
    setTimeLeft(sessions[type].duration)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
      <div className="text-center mb-8">
        <div
          className={`inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br ${session.color} text-white mb-4`}
        >
          {session.icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {session.name}
        </h2>
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < sessionCount
                  ? 'bg-indigo-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="relative w-64 h-64 mx-auto mb-8">
        <svg className="absolute inset-0 -rotate-90 w-64 h-64">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${
              2 * Math.PI * 120 * (1 - progress / 100)
            }`}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="gradient">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-gray-800 dark:text-gray-100">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={toggleTimer}
          className={`px-8 py-3 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all bg-gradient-to-r ${
            isRunning
              ? 'from-orange-500 to-red-500'
              : 'from-green-500 to-emerald-500'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="inline w-5 h-5 mr-2" />
              一時停止
            </>
          ) : (
            <>
              <Play className="inline w-5 h-5 mr-2" />
              開始
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <RotateCcw className="inline w-5 h-5 mr-2" />
          リセット
        </button>
      </div>

      <div className="flex justify-center gap-2">
        {Object.entries(sessions).map(([key, sess]) => (
          <button
            key={key}
            onClick={() => switchSession(key as SessionType)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentSession === key
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {sess.name}
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          今日の完了セッション: {totalSessions}
        </p>
      </div>
    </div>
  )
}