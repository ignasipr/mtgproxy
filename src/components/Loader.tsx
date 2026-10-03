import './Loader.css'

interface LoaderProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'spinner' | 'dots' | 'bar'
  className?: string
  label?: string
}

export function Loader({
  size = 'medium',
  variant = 'spinner',
  className = '',
  label,
}: LoaderProps) {
  const sizeClasses: Record<string, string> = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large',
  }

  return (
    <div className={`loader-container ${className}`}>
      <div className={`loader ${variant} ${sizeClasses[size]}`} />
      {label && <p className="loader-label">{label}</p>}
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="loading-card">
      <div className="loading-card-image" />
      <div className="loading-card-content">
        <div style={{ height: '20px', marginBottom: '8px' }} />
        <div style={{ height: '16px', marginBottom: '8px' }} />
      </div>
    </div>
  )
}

export function LoadingGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="loading-grid">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}
