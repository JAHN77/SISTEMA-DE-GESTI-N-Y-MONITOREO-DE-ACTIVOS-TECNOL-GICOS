'use client'

import { AssetImage } from './asset-image'

interface Props {
  imageUrl?: string | null
  categoryName?: string | null
  alt?: string
}

export function AssetThumbnail({ imageUrl, categoryName, alt }: Props) {
  return <AssetImage imageUrl={imageUrl} categoryName={categoryName} size={40} alt={alt} />
}
