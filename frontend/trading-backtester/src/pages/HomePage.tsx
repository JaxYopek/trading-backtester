import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <main className="page">
      <h1>Trading Backtester</h1>
      <p className="lead">Run backtests and compare strategy performance.</p>
      <Link className="primary-link" to="/backtest">
        Start a Backtest
      </Link>
    </main>
  )
}
