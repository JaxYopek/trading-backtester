import { Suspense, lazy } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import BacktestPage from './pages/BacktestPage'

const ResultsPage = lazy(() => import('./pages/ResultsPage'))

function App() {
  return (
    <BrowserRouter>
      <header>
        <nav className="top-nav">
          <Link to="/">Home</Link>
          <Link to="/backtest">Backtest</Link>
          <Link to="/results">Results</Link>
        </nav>
      </header>

      <Suspense fallback={<main className="page"><p className="lead">Loading…</p></main>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/backtest" element={<BacktestPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
