import React from 'react';

/**
 * Single page surface.
 *
 * isTrace: page paper is 50% opaque (tracing paper).
 *   The opacity wrapper is applied by the PARENT (PageSpread), not here.
 *   This component only renders the content — background, image, gradients.
 *
 * isBacking: the reverse face of a turning page (warm off-white).
 *
 * side: 'left' | 'right' — controls which direction the spine shadow falls.
 */
export default function Page({ page, side, isBacking }) {
  const isLeft = side === 'left';

  // Strong shadow toward the spine — pages curve into the binding.
  const spineGradient = isLeft
    ? 'linear-gradient(to left,  rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 18%, rgba(0,0,0,0.02) 45%, transparent 70%)'
    : 'linear-gradient(to right, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 18%, rgba(0,0,0,0.02) 45%, transparent 70%)';

  const edgeGradient = isLeft
    ? 'linear-gradient(to right, rgba(0,0,0,0.10) 0%, transparent 12%)'
    : 'linear-gradient(to left,  rgba(0,0,0,0.10) 0%, transparent 12%)';

  const bgColor = isBacking ? '#f5f0e8' : '#faf9f6';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        overflow: 'hidden',
      }}
    >
      {page?.src && !isBacking && (
        <img
          src={page.src}
          alt={`Page ${page.id}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {!page && !isBacking && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0,0,0,0.10)',
            fontSize: '0.7rem',
            fontFamily: 'sans-serif',
            letterSpacing: '0.12em',
          }}
        >
          BLANK
        </div>
      )}

      {/* Spine curvature shadow */}
      <div style={{ position: 'absolute', inset: 0, background: spineGradient, pointerEvents: 'none' }} />
      {/* Outer edge shadow */}
      <div style={{ position: 'absolute', inset: 0, background: edgeGradient, pointerEvents: 'none' }} />
    </div>
  );
}
