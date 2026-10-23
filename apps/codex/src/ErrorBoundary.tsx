import { Component, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <main className="error-recovery" role="alert">
      <h1>学习界面未能加载</h1>
      <p>请重新打开界面。本机记录会保留；如果问题持续，可关闭应用后重开。</p>
      <button className="primary-button" onClick={() => window.location.reload()}>重新加载界面</button>
    </main>
  }
}
