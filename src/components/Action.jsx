export function Action({ children, onClick, secondary = false, type = 'button', disabled = false }) {
  return (
    <button
      type={type}
      className={secondary ? 'button button-secondary' : 'button'}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
