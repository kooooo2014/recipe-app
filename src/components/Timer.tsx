import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Bell } from 'lucide-react'

interface Props {
  initialMinutes: number
}

export function Timer({ initialMinutes }: Props) {
  const [seconds, setSeconds] = useState(initialMinutes * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(initialMinutes)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            setFinished(true)
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                  new Notification('タイマー終了', { body: '調理時間が終わりました！' })
                }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const reset = () => {
    setRunning(false)
    setFinished(false)
    setSeconds(customMinutes * 60)
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const total = customMinutes * 60
  const progress = total > 0 ? ((total - seconds) / total) * 100 : 0

  return (
    <div className={`rounded-2xl p-4 ${finished ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Bell size={16} className="text-orange-500" />
        <span className="text-sm font-medium text-gray-700">タイマー</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={`text-3xl font-mono font-bold ${finished ? 'text-red-500' : 'text-orange-600'}`}>
          {mm}:{ss}
        </div>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-400 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRunning(r => !r)}
            className="bg-orange-500 text-white rounded-full p-2"
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={reset} className="bg-gray-200 rounded-full p-2">
            <RotateCcw size={16} className="text-gray-600" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-500">設定時間:</span>
        <input
          type="number"
          min={1}
          max={999}
          value={customMinutes}
          onChange={e => {
            const v = Math.max(1, parseInt(e.target.value) || 1)
            setCustomMinutes(v)
            if (!running) setSeconds(v * 60)
          }}
          className="w-16 border rounded px-2 py-1 text-sm text-center"
        />
        <span className="text-xs text-gray-500">分</span>
      </div>
      {finished && (
        <p className="mt-2 text-red-500 text-sm font-medium animate-pulse">タイマー終了！</p>
      )}
    </div>
  )
}
