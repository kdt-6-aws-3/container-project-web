export function Notice({ children, tone = 'info' }) {
  return (
    <div
      className={'notice notice-' + tone}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}
