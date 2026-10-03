import React from 'react'
import './Skeleton.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  count?: number
  className?: string
  variant?: 'text' | 'rect' | 'circle'
}

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  count = 1,
  className = '',
  variant = 'rect',
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  }

  const variants: Record<string, React.CSSProperties> = {
    circle: { borderRadius: '50%' },
    text: { borderRadius: '4px', height: '20px' },
    rect: { borderRadius: '4px' },
  }

  const variantStyle = variants[variant] || {}

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${variant} ${className}`}
          style={{ ...style, ...variantStyle }}
          aria-hidden="true"
        />
      ))}
    </>
  )
}
