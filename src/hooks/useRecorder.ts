import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'done' | 'error'
export type RecorderError = 'denied' | 'unsupported' | 'nodevice'
export type VolumeLabel = 'baixo' | 'bom' | 'alto'

export interface RecorderResult {
  blob: Blob
  duration: number
  volume: VolumeLabel
  noisy: boolean
  simulated: boolean
}

interface Live {
  level: number
  seconds: number
  volume: VolumeLabel | null
  noisy: boolean
}

const QUIET = 0.012
const percentile = (values: number[], p: number) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) * p)]
}

function classify(samples: number[]): { volume: VolumeLabel | null; noisy: boolean } {
  if (samples.length < 10) return { volume: null, noisy: false }
  const floor = percentile(samples, 0.15)
  const speech = samples.filter((s) => s > Math.max(QUIET, floor * 2))
  const avg = speech.length ? speech.reduce((a, b) => a + b, 0) / speech.length : 0
  const volume: VolumeLabel = avg < 0.03 ? 'baixo' : avg > 0.32 ? 'alto' : 'bom'
  return { volume, noisy: floor > 0.025 }
}

/**
 * Gravação pelo microfone com indicadores em tempo real (volume, ruído, duração).
 * Quando não há microfone disponível, `simulate()` permite seguir o fluxo em modo demonstração.
 */
export function useRecorder(maxSeconds: number) {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [error, setError] = useState<RecorderError | null>(null)
  const [live, setLive] = useState<Live>({ level: 0, seconds: 0, volume: null, noisy: false })
  const [result, setResult] = useState<RecorderResult | null>(null)

  const r = useRef({
    stream: null as MediaStream | null,
    recorder: null as MediaRecorder | null,
    audioCtx: null as AudioContext | null,
    chunks: [] as Blob[],
    samples: [] as number[],
    startedAt: 0,
    raf: 0,
    timer: 0,
    simulated: false,
    lastPush: 0,
  })

  const cleanup = useCallback(() => {
    const s = r.current
    cancelAnimationFrame(s.raf)
    window.clearInterval(s.timer)
    s.stream?.getTracks().forEach((t) => t.stop())
    s.audioCtx?.close().catch(() => undefined)
    s.stream = null
    s.audioCtx = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  const finish = useCallback(
    (blob: Blob) => {
      const s = r.current
      const duration = Math.min(maxSeconds, (performance.now() - s.startedAt) / 1000)
      const { volume, noisy } = classify(s.samples)
      cleanup()
      setResult({ blob, duration, volume: volume ?? 'baixo', noisy, simulated: s.simulated })
      setLive((l) => ({ ...l, level: 0 }))
      setStatus('done')
    },
    [cleanup, maxSeconds],
  )

  const stop = useCallback(() => {
    const s = r.current
    if (s.simulated) {
      finish(new Blob([], { type: 'audio/webm' }))
    } else if (s.recorder && s.recorder.state !== 'inactive') {
      s.recorder.stop()
    }
  }, [finish])

  const track = useCallback(
    (level: number) => {
      const s = r.current
      s.samples.push(level)
      const now = performance.now()
      const seconds = (now - s.startedAt) / 1000
      if (seconds >= maxSeconds) {
        stop()
        return
      }
      if (now - s.lastPush > 120) {
        s.lastPush = now
        setLive({ level, seconds, ...classify(s.samples.slice(-400)) })
      }
    },
    [maxSeconds, stop],
  )

  const reset = useCallback(() => {
    cleanup()
    r.current.samples = []
    setResult(null)
    setError(null)
    setLive({ level: 0, seconds: 0, volume: null, noisy: false })
    setStatus('idle')
  }, [cleanup])

  const start = useCallback(async () => {
    reset()
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('unsupported')
      setStatus('error')
      return
    }
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      })
      const s = r.current
      s.stream = stream
      s.simulated = false
      s.chunks = []
      s.samples = []

      const audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 1024
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      s.audioCtx = audioCtx
      const buffer = new Float32Array(analyser.fftSize)

      const recorder = new MediaRecorder(stream)
      s.recorder = recorder
      recorder.ondataavailable = (e) => e.data.size && s.chunks.push(e.data)
      recorder.onstop = () => finish(new Blob(s.chunks, { type: recorder.mimeType || 'audio/webm' }))
      recorder.start(250)
      s.startedAt = performance.now()
      setStatus('recording')

      const loop = () => {
        analyser.getFloatTimeDomainData(buffer)
        let sum = 0
        for (const v of buffer) sum += v * v
        track(Math.sqrt(sum / buffer.length))
        if (r.current.recorder?.state === 'recording') s.raf = requestAnimationFrame(loop)
      }
      loop()
    } catch (err) {
      const name = (err as DOMException)?.name
      setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' ? 'nodevice' : 'unsupported')
      setStatus('error')
      cleanup()
    }
  }, [cleanup, finish, reset, track])

  /** Modo demonstração: simula níveis de voz sem acessar o microfone. */
  const simulate = useCallback(() => {
    reset()
    const s = r.current
    s.simulated = true
    s.recorder = null
    s.samples = []
    s.startedAt = performance.now()
    setStatus('recording')
    s.timer = window.setInterval(() => track(0.06 + Math.random() * 0.18), 80)
  }, [reset, track])

  return { status, error, live, result, start, stop, reset, simulate }
}
