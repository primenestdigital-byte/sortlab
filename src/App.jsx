import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ALGOS, isSorted } from './algorithms.js'

const KEY = 'sortlab'

function randomArray(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5)
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s?.selected?.length) return s
  } catch { /* ignore */ }
  return { selected: ['bubble', 'quick'], size: 40, speed: 30 }
}

function Bars({ frame, height }) {
  const max = Math.max(...frame.arr)
  return (
    <div className="flex h-full items-end gap-[1px]" style={{ height }}>
      {frame.arr.map((v, i) => {
        const isA = i === frame.a, isB = i === frame.b
        const cls = frame.kind === 'done' || frame.sorted === 'all'
          ? 'sorted' : (isA || isB) ? frame.kind : ''
        return (
          <div key={i}
            className={`bar ${cls}`}
            style={{ height: `${(v / max) * 100}%`, width: `${100 / frame.arr.length}%`, background: 'var(--bar)' }} />
        )
      })}
    </div>
  )
}

export default function App() {
  const initial = useRef(loadState())
  const [selected, setSelected] = useState(initial.current.selected)
  const [size, setSize] = useState(initial.current.size)
  const [speed, setSpeed] = useState(initial.current.speed)
  const [arr, setArr] = useState(() => randomArray(initial.current.size))
  const [running, setRunning] = useState(false)
  const [frames, setFrames] = useState({})   // algo -> latest frame
  const [done, setDone] = useState({})       // algo -> true
  const [steps, setSteps] = useState(0)
  const gensRef = useRef({})
  const timerRef = useRef(null)

  const persist = (patch) => {
    const next = { selected, size, speed, ...patch }
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const reshuffle = useCallback((n = size) => {
    setRunning(false)
    clearInterval(timerRef.current)
    gensRef.current = {}
    setFrames({})
    setDone({})
    setSteps(0)
    setArr(randomArray(n))
  }, [size])

  const start = () => {
    reshuffle()
    setRunning(true)
    // init generators on the same starting array
    const startArr = randomArray(size)
    setArr(startArr)
    gensRef.current = {}
    for (const key of selected) {
      gensRef.current[key] = ALGOS[key].gen(startArr)
    }
    setFrames({})
    setDone({})
    setSteps(0)
    // tick interval — speed slider = steps per tick
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSteps(s => {
        let alive = false
        setFrames(prev => {
          const next = { ...prev }
          for (const key of Object.keys(gensRef.current)) {
            if (done[key]) continue
            const gen = gensRef.current[key]
            let frame = null
            for (let k = 0; k < speed; k++) {
              const r = gen.next()
              if (r.value && r.value.kind === 'done') {
                next[key] = r.value
                setDone(d => ({ ...d, [key]: true }))
                break
              }
              if (r.value) frame = r.value
              if (r.done) { setDone(d => ({ ...d, [key]: true })); break }
            }
            if (frame) next[key] = frame
            if (!done[key]) alive = true
          }
          return next
        })
        if (!alive) {
          clearInterval(timerRef.current)
          setRunning(false)
        }
        return s + 1
      })
    }, 30)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const winner = useMemo(() => {
    const entries = Object.entries(frames)
      .filter(([k, f]) => f?.compares != null)
      .sort((a, b) => (a[1].compares + a[1].writes) - (b[1].compares + b[1].writes))
    return entries[0]?.[0]
  }, [frames])

  const toggleAlgo = (key) => {
    if (running) return
    setSelected(sel => {
      const next = sel.includes(key) ? sel.filter(k => k !== key) : [...sel, key]
      if (!next.length) return sel
      persist({ selected: next })
      return next
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sort<span style={{ color: 'var(--bar)' }}>Lab</span></h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>same array, six algorithms, head-to-head</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="ctl-btn" onClick={() => reshuffle()} disabled={running}>shuffle</button>
          <button className="ctl-btn active" onClick={start} disabled={running || !selected.length}>
            {running ? 'racing…' : 'race!'}
          </button>
        </div>
      </header>

      {/* algo selection */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {Object.entries(ALGOS).map(([key, a]) => (
          <button key={key}
            className={`ctl-btn ${selected.includes(key) ? 'active' : ''}`}
            onClick={() => toggleAlgo(key)}
            disabled={running}
            title={a.complexity}>
            {a.name} <span className="opacity-60">{a.complexity}</span>
          </button>
        ))}
        <span className="flex-1" />
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          elements
          <input type="range" min="15" max="90" value={size}
            onChange={e => { setSize(Number(e.target.value)); reshuffle(Number(e.target.value)); persist({ size: Number(e.target.value) }) }}
            disabled={running} className="w-24" />
          <span className="mono w-6">{size}</span>
        </label>
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          speed
          <input type="range" min="1" max="200" value={speed}
            onChange={e => { setSpeed(Number(e.target.value)); persist({ speed: Number(e.target.value) }) }}
            className="w-24" />
        </label>
      </div>

      {/* race grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {selected.map(key => {
          const f = frames[key] ?? { arr, kind: 'idle' }
          const a = ALGOS[key]
          const isDone = done[key]
          const ops = (f.compares ?? 0) + (f.writes ?? 0)
          return (
            <div key={key} className={`algo-card p-3 ${isDone && winner === key ? 'winner' : ''}`}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold">{a.name}</span>
                <span className="mono text-xs" style={{ color: isDone ? 'var(--sorted)' : 'var(--muted)' }}>
                  {isDone ? '✓ done' : `${ops} ops`}
                </span>
              </div>
              <Bars frame={f} height={140} />
              <div className="mono mt-2 flex justify-between text-[10px]" style={{ color: 'var(--muted)' }}>
                <span>{f.compares ?? 0} compares</span>
                <span>{f.writes ?? 0} writes</span>
                <span>{a.complexity}</span>
              </div>
            </div>
          )
        })}
      </div>

      {winner && !running && (
        <p className="mt-5 text-center text-sm">
          🏆 <strong>{ALGOS[winner].name}</strong> wins with {(frames[winner].compares + frames[winner].writes).toLocaleString()} operations
          on {size.toLocaleString()} elements
        </p>
      )}
    </div>
  )
}
