import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'

type ModuleId = 'stopwatch' | 'alarms' | 'timers' | 'world-clock'

type ClockModule = {
  id: ModuleId
  label: string
  requirements: string[]
  testingApproach: string
}

const notesBaseUrl = 'https://raw.githubusercontent.com/LuisOspina/clock-notes/main'

const modules: ClockModule[] = [
  {
    id: 'stopwatch',
    label: 'Stopwatch',
    requirements: [
      'The initial time is 00:00.00 and only the Start button is visible.',
      'Start begins the timer, changes Start to Stop, and reveals Reset and Lap.',
      'Stop freezes the main timer and active lap timer, and hides Lap.',
      'Start resumes a stopped timer without clearing its elapsed time or laps.',
      'Reset returns the timer to 00:00.00 and clears every lap.',
      'The first Lap records lap 01 and begins a live lap 02.',
      'Each additional Lap freezes the active lap and begins the next one.',
      'The lap list is horizontally scrollable and shows three cards at a time.',
    ],
    testingApproach: 'Add your Stopwatch testing notes here as you work through them.',
  },
  {
    id: 'alarms',
    label: 'Alarms',
    requirements: [
      'This module is a placeholder in the first release.',
      'Alarm creation, repetition, snoozing, and next-trigger logic are not implemented yet.',
    ],
    testingApproach: 'Testing notes will be added when this module is implemented.',
  },
  {
    id: 'timers',
    label: 'Timers',
    requirements: [
      'This module is a placeholder in the first release.',
      'Countdown creation, pausing, resuming, and completion alerts are not implemented yet.',
    ],
    testingApproach: 'Testing notes will be added when this module is implemented.',
  },
  {
    id: 'world-clock',
    label: 'World Clock',
    requirements: [
      'This module is a placeholder in the first release.',
      'City selection, time-zone conversion, and daylight-saving behavior are not implemented yet.',
    ],
    testingApproach: 'Testing notes will be added when this module is implemented.',
  },
]

function formatTime(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds)
  const minutes = Math.floor(safeMilliseconds / 60_000)
  const seconds = Math.floor((safeMilliseconds % 60_000) / 1_000)
  const hundredths = Math.floor((safeMilliseconds % 1_000) / 10)

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
}

function formatLapNumber(number: number) {
  return String(number).padStart(2, '0')
}

function getFallbackNotes(module: ClockModule) {
  const requirements = module.requirements
    .map((requirement, index) => `${index + 1}. ${requirement}`)
    .join('\n')

  return `# Functional requirements\n\n${requirements}\n\n## Testing approach\n\n${module.testingApproach}`
}

function NotesPanel({ module }: { module: ClockModule }) {
  const [notes, setNotes] = useState(() => getFallbackNotes(module))

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${notesBaseUrl}/${module.id}.md`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Notes could not be loaded')
        }

        return response.text()
      })
      .then(setNotes)
      .catch(() => {})

    return () => controller.abort()
  }, [module])

  return (
    <section className="requirements-panel" aria-label="Requirements and testing notes">
      <ReactMarkdown>{notes}</ReactMarkdown>
    </section>
  )
}

function Stopwatch() {
  const [elapsedBeforeStart, setElapsedBeforeStart] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [displayElapsed, setDisplayElapsed] = useState(0)
  const [lapTotals, setLapTotals] = useState<number[]>([])
  const lapList = useRef<HTMLDivElement>(null)
  const isRunning = startedAt !== null

  useEffect(() => {
    if (startedAt === null) {
      return
    }

    let animationFrame = 0

    const updateTime = () => {
      setDisplayElapsed(elapsedBeforeStart + performance.now() - startedAt)
      animationFrame = requestAnimationFrame(updateTime)
    }

    animationFrame = requestAnimationFrame(updateTime)

    return () => cancelAnimationFrame(animationFrame)
  }, [elapsedBeforeStart, startedAt])

  const laps = useMemo(() => {
    const completedLaps = lapTotals.map((total, index) => ({
      number: index + 1,
      lapTime: total - (lapTotals[index - 1] ?? 0),
      totalTime: total,
    }))

    if (lapTotals.length === 0) {
      return completedLaps
    }

    return [
      ...completedLaps,
      {
        number: lapTotals.length + 1,
        lapTime: displayElapsed - lapTotals[lapTotals.length - 1],
        totalTime: displayElapsed,
      },
    ]
  }, [displayElapsed, lapTotals])

  useEffect(() => {
    lapList.current?.scrollTo({ left: lapList.current.scrollWidth })
  }, [laps.length])

  const start = () => {
    if (!isRunning) {
      setStartedAt(performance.now())
    }
  }

  const stop = () => {
    if (startedAt === null) {
      return
    }

    const elapsed = elapsedBeforeStart + performance.now() - startedAt
    setElapsedBeforeStart(elapsed)
    setDisplayElapsed(elapsed)
    setStartedAt(null)
  }

  const reset = () => {
    setElapsedBeforeStart(0)
    setDisplayElapsed(0)
    setStartedAt(null)
    setLapTotals([])
  }

  const addLap = () => {
    if (startedAt === null) {
      return
    }

    const elapsed = elapsedBeforeStart + performance.now() - startedAt
    setDisplayElapsed(elapsed)
    setLapTotals((currentLaps) => [...currentLaps, elapsed])
  }

  return (
    <section className="stopwatch" aria-labelledby="stopwatch-title">
      <h2 id="stopwatch-title">Stopwatch</h2>

      <output
        className="stopwatch-time"
        aria-label="Elapsed time"
        data-testid="stopwatch-time"
        role="timer"
      >
        {formatTime(displayElapsed)}
      </output>

      {laps.length > 0 && (
        <div className="lap-list" aria-label="Laps" ref={lapList}>
          {laps.map((lap) => {
            const lapNumber = formatLapNumber(lap.number)

            return (
              <article
                className="lap-card"
                data-testid={`lap-card-${lapNumber}`}
                key={lap.number}
              >
                <strong>{lapNumber}</strong>
                <output aria-label={`Lap ${lapNumber} time`}>
                  {formatTime(lap.lapTime)}
                </output>
                <output aria-label={`Lap ${lapNumber} total time`}>
                  {formatTime(lap.totalTime)}
                </output>
              </article>
            )
          })}
        </div>
      )}

      <div className="stopwatch-actions">
        <button className="primary-action" onClick={isRunning ? stop : start}>
          {isRunning ? 'Stop' : 'Start'}
        </button>

        {(isRunning || displayElapsed > 0) && (
          <div className="secondary-actions">
            <button onClick={reset}>Reset</button>
            {isRunning && <button onClick={addLap}>Lap</button>}
          </div>
        )}
      </div>
    </section>
  )
}

function Placeholder({ module }: { module: ClockModule }) {
  return (
    <section className="placeholder" aria-labelledby={`${module.id}-title`}>
      <p>Coming later</p>
      <h2 id={`${module.id}-title`}>{module.label}</h2>
      <span>This module is intentionally a placeholder.</span>
    </section>
  )
}

function App() {
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>('stopwatch')
  const activeModule = modules.find((module) => module.id === activeModuleId) ?? modules[0]

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#main">
          Clock
        </a>

        <nav aria-label="Clock modules">
          {modules.map((module) => (
            <button
              aria-pressed={activeModuleId === module.id}
              key={module.id}
              onClick={() => setActiveModuleId(module.id)}
            >
              {module.label}
            </button>
          ))}
        </nav>
      </header>

      <main id="main" className="app-main">
        <NotesPanel key={activeModule.id} module={activeModule} />

        <section className="module-panel" aria-label={`${activeModule.label} module`}>
          <div hidden={activeModuleId !== 'stopwatch'}>
            <Stopwatch />
          </div>

          {activeModuleId !== 'stopwatch' && <Placeholder module={activeModule} />}
        </section>
      </main>
    </div>
  )
}

export default App
