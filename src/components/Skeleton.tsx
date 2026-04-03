// src/components/Skeleton.tsx - Skeleton screen component

import React from 'react'
import './Skeleton.css'

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular'
  width?: number | string
  height?: number | string
  className?: string
  animation?: 'pulse' | 'wave' | false
  count?: number
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  className,
  animation = 'pulse',
  count = 1
}) => {
  const getStyle = () => {
    const style: React.CSSProperties = {
      width,
      height
    }

    if (variant === 'circular') {
      style.borderRadius = '50%'
      if (!height) style.height = width
    } else if (variant === 'rectangular') {
      style.borderRadius = '4px'
    }

    return style
  }

  const skeletonElements = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`
        skeleton
        skeleton--${variant}
        ${animation ? `skeleton--${animation}` : ''}
        ${className || ''}
      `}
      style={getStyle()}
    />
  ))

  return <>{skeletonElements}</>
}

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; width?: string | number }> = ({ 
  lines = 3, 
  width = '100%' 
}) => (
  <div className="skeleton-text">
    {Array.from({ length: lines }, (_, index) => (
      <Skeleton
        key={index}
        variant="text"
        width={width}
        height={16}
        animation="wave"
      />
    ))}
  </div>
)

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <div className="skeleton-card">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="skeleton-card__container">
        <Skeleton variant="circular" width={40} height={40} animation="pulse" />
        <div className="skeleton-card__content">
          <Skeleton variant="text" width="60%" height={16} animation="wave" />
          <Skeleton variant="text" width="100%" height={14} animation="wave" />
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="skeleton-table">
    <div className="skeleton-table__header">
      {Array.from({ length: cols }, (_, index) => (
        <Skeleton key={index} variant="text" width="100%" height={20} animation="wave" />
      ))}
    </div>
    <div className="skeleton-table__body">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table__row">
          {Array.from({ length: cols }, (_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width="100%" height={16} animation="pulse" />
          ))}
        </div>
      ))}
    </div>
  </div>
)

export const SkeletonDashboard: React.FC = () => (
  <div className="skeleton-dashboard">
    <div className="skeleton-dashboard__header">
      <Skeleton variant="text" width="200px" height={24} animation="wave" />
      <Skeleton variant="text" width="400px" height={16} animation="wave" />
    </div>
    
    <div className="skeleton-dashboard__stats">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="skeleton-dashboard__stat">
          <Skeleton variant="rectangular" width={60} height={60} animation="pulse" />
          <div className="skeleton-dashboard__stat-content">
            <Skeleton variant="text" width="80px" height={16} animation="wave" />
            <Skeleton variant="text" width="120px" height={14} animation="wave" />
          </div>
        </div>
      ))}
    </div>
    
    <div className="skeleton-dashboard__content">
      <div className="skeleton-dashboard__chart">
        <Skeleton variant="rectangular" width="100%" height={200} animation="pulse" />
      </div>
      <div className="skeleton-dashboard__list">
        <Skeleton variant="text" width="150px" height={20} animation="wave" />
        <SkeletonTable rows={3} cols={3} />
      </div>
    </div>
  </div>
)

export default Skeleton