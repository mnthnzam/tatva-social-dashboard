import type { Format, Img } from '../types'
import { Icon } from './Icon'

/**
 * Shows the whole post, never cropped: the image is letterboxed ("contain") inside the frame,
 * with a blurred copy of itself filling any empty space so grids stay even.
 */
export function Creative({ img, format, ratio = '4 / 5', label, onClick, placeholder }: {
  img: Img | null
  format?: Format
  ratio?: string
  label?: string
  onClick?: () => void
  placeholder?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={`creative${onClick ? ' clickable' : ''}`} style={{ aspectRatio: ratio }} onClick={onClick} aria-label={label}>
      {img ? (
        <>
          <span className="creative-bg" style={{ backgroundImage: `url("${img.src}")` }} />
          <img src={img.src} alt={label ?? ''} loading="lazy" width={img.w} height={img.h} />
        </>
      ) : (
        <span className="creative-empty">
          <Icon name={format ? format.toLowerCase() : 'static'} size={26} />
          <span>{placeholder ?? 'No preview'}</span>
        </span>
      )}
      {img && format && format !== 'Static' && (
        <span className="creative-kind" title={format}><Icon name={format.toLowerCase()} size={14} /></span>
      )}
    </Tag>
  )
}
