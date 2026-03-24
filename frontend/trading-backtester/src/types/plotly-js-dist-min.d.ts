declare module 'plotly.js-dist-min' {
  import type { PlotlyHTMLElement } from 'plotly.js'

  type PlotlyType = {
    newPlot: (...args: unknown[]) => Promise<PlotlyHTMLElement>
    react: (...args: unknown[]) => Promise<PlotlyHTMLElement>
    purge: (...args: unknown[]) => void
  }

  const Plotly: PlotlyType
  export default Plotly
}
