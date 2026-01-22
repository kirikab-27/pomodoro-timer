'use client'

import { useState } from 'react'
import { X, Save, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsProps {
  onClose: () => void
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

const defaultSettings: TimerSettings = {
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

export default function Settings({ onClose }: SettingsProps) {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoroSettings')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return defaultSettings
        }
      }
    }
    return defaultSettings
  })

  const handleSave = () => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings))
    // カスタムイベントを発行して設定変更を通知
    window.dispatchEvent(new Event('pomodoroSettingsChanged'))
    toast.success('設定を保存しました')
    onClose()
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('pomodoroSettings')
    toast.info('設定をリセットしました')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          設定
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            タイマー設定
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                作業時間（分）
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.workDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    workDuration: parseInt(e.target.value) || 25,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                短い休憩（分）
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shortBreakDuration: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                長い休憩（分）
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    longBreakDuration: parseInt(e.target.value) || 15,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                長い休憩まで
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.sessionsUntilLongBreak}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sessionsUntilLongBreak: parseInt(e.target.value) || 4,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            自動開始
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoStartBreaks: e.target.checked,
                  })
                }
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-gray-700 dark:text-gray-300">
                休憩を自動的に開始
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoStartPomodoros}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoStartPomodoros: e.target.checked,
                  })
                }
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-gray-700 dark:text-gray-300">
                作業セッションを自動的に開始
              </span>
            </label>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            通知
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              音量 ({settings.notificationVolume}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={settings.notificationVolume}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notificationVolume: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            目標
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              1日の目標セッション数
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.dailyGoal}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dailyGoal: parseInt(e.target.value) || 8,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </section>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={handleReset}
          className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <RotateCcw className="inline w-4 h-4 mr-2" />
          リセット
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
        >
          <Save className="inline w-4 h-4 mr-2" />
          保存
        </button>
      </div>
    </div>
  )
}