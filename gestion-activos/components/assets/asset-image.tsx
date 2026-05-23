'use client'

import { useState } from 'react'
import { AssetFallbackIcon } from './asset-fallback-icon'

interface Props {
  imageUrl?: string | null
  categoryName?: string | null
  size?: number
  alt?: string
}

export function AssetImage({ imageUrl, categoryName, size = 80, alt = 'Activo' }: Props) {
  const [error, setError] = useState(false)

  const iconSize = Math.round(size * 0.42)
  const radius   = size >= 72 ? 14 : 10

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    overflow: 'hidden',
    background: 'var(--color-bg-overlay)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (imageUrl && !error) {
    return (
      <div style={containerStyle}>
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onError={() => setError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <AssetFallbackIcon categoryName={categoryName} size={iconSize} />
    </div>
  )
}
