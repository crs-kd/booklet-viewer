import React from 'react';

/**
 * Single page surface.
 *
 * isTrace — renders page background as 50% opaque white (tracing paper effect).
 *   The image on the trace page is at 100% opacity.
 *   pageBelow — the page physically beneath this one in the stack — bleeds
 *   through at reduced opacity to simulate translucency.
 *
 * isBacking — the reverse face of a page mid-turn (warm off-white paper back).
 *
 * side — 'left' | 'right', controls which direction the spine gradient falls.
 */
export default function Page({ page, side, isTrace, isBacking, pageBelow }) {
  const isLeft = side === 'left';

  // Strong inner shadow toward the spine — gives the impression pages
  // curve up and fold into the binding.
  const spineGradient = isLeft
    ? 'linear-gradient(to left, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 18%, rgba(0,0,0,0.02) 45%, transparent 70%)'
    : 'linear-gradient(to right, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 18%, rgba(0,0,0,0.02) 45%, transparent 70%)';

  // Faint outer edge shadow
  const edgeGradient = isLeft
    ? 'linear-gradient(to right, rgba(0,0,0,0.10) 0%, transparent 12%)'
    : 'linear-gradient(to left, rgba(0,0,0,0.10) 0%, transparent 12%)';

  const bgColor = isBacking
    ? '#f5f0e8'
    : isTrace
    ? 'rgba(255,255,255,0.50)'
    : '#faf9f6';

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
      {/* Trace: page beneath bleeds through at ~45% to create the semi-transparent look */}
      {isTrace && pageBelow && (
        <img
          src={pageBelow.src}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.45,
          }}
        />
      )}

      {/* Main page image — always full opacity (isolated from background opacity via rgba bg, not CSS opacity) */}
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

      {/* Empty page placeholder */}
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

      {/* Spine curvature gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: spineGradient,
          pointerEvents: 'none',
        }}
      />

      {/* Outer edge vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: edgeGradient,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
