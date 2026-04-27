import type { BacktestRequest, BacktestResponse, StrategyType } from './backtestApi'

export interface BacktestRun {
  request: BacktestRequest
  result: BacktestResponse
}

export interface SavedBacktestRun extends BacktestRun {
  id: string
  savedAt: string
  label: string
}

const LAST_RUN_KEY = 'trading-backtester:last-run'
const SAVED_RUNS_KEY = 'trading-backtester:saved-runs'

function isBrowserStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function readJson<T>(storageKey: string, fallback: T): T {
  if (!isBrowserStorageAvailable()) {
    return fallback
  }

  try {
    const rawValue = window.sessionStorage.getItem(storageKey)
    if (!rawValue) {
      return fallback
    }

    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

function writeJson(storageKey: string, value: unknown) {
  if (!isBrowserStorageAvailable()) {
    return
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(value))
}

function createRunId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function buildRunLabel(run: BacktestRun) {
  const returnPct = run.result.metrics.total_return_pct
  const returnPrefix = returnPct >= 0 ? '+' : ''

  return `${run.request.symbol.toUpperCase()} · ${strategyLabel(run.request.strategy)} · ${returnPrefix}${returnPct.toFixed(2)}%`
}

export function loadLastRun(): BacktestRun | null {
  return readJson<BacktestRun | null>(LAST_RUN_KEY, null)
}

export function saveLastRun(run: BacktestRun) {
  writeJson(LAST_RUN_KEY, run)
}

export function loadSavedRuns(): SavedBacktestRun[] {
  const savedRuns = readJson<SavedBacktestRun[]>(SAVED_RUNS_KEY, [])

  return Array.isArray(savedRuns) ? savedRuns : []
}

export function saveRun(run: BacktestRun) {
  const entry: SavedBacktestRun = {
    id: createRunId(),
    savedAt: new Date().toISOString(),
    label: buildRunLabel(run),
    request: run.request,
    result: run.result,
  }

  const nextRuns = [entry, ...loadSavedRuns()]
  writeJson(SAVED_RUNS_KEY, nextRuns)

  return entry
}

export function removeSavedRun(id: string) {
  const nextRuns = loadSavedRuns().filter((run) => run.id !== id)
  writeJson(SAVED_RUNS_KEY, nextRuns)
  return nextRuns
}

export function clearSavedRuns() {
  writeJson(SAVED_RUNS_KEY, [])
}

export function exportRuns(runs: SavedBacktestRun[], filename = 'saved-backtest-results.json') {
  if (!isBrowserStorageAvailable()) {
    return
  }

  const payload = JSON.stringify(runs, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.rel = 'noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function strategyLabel(strategy: StrategyType) {
  return strategy
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}