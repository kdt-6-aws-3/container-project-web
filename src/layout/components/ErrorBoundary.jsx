import { Component } from 'react'
import { reportClientError } from '@/config/ApiService'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '알 수 없는 오류가 발생했습니다.' }
  }

  componentDidCatch(error, info) {
    reportClientError('error', error?.message || String(error), window.location.href, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="notice notice-error" role="alert" style={{ margin: '2rem auto', maxWidth: '600px' }}>
          <strong>예상치 못한 오류가 발생했습니다.</strong>
          <p>{this.state.message}</p>
          <button className="button" onClick={() => window.location.reload()}>페이지 새로고침</button>
        </div>
      )
    }
    return this.props.children
  }
}
