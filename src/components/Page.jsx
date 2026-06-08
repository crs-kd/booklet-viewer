import React from 'react';

/**
 * Renders a single page surface.
 * side: 'left' | 'right' — affects spine gradient direction.
 * isTrace: renders page bg at 50% opacity, image at 100%.
 * isBacking: the back face of a turning page (slightly warm tint).
 * pageBelow: page object that shows through when this is a trace page.
 */
export default function Page({ page, side, isTrace, isBacking, pageBelow, style = {} }) {
  const isLeft = side === 'left';

  // Spine shadow gradient — pages curl toward the spine
  const spineGradient = isLeft
    ? 'linear-gradient(to left, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 30%, transparent 70%)'
    : 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 30%, transparent 70%)';

  // Edge vignette — subtle darkening at page edges
  const edgeGradient = isLeft
    ? 'linear-gradient(to right, rgba(0,0,0,0.08) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.04) 100%)'
    : 'linear-gradient(to left, rgba(0,0,0,0.08) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.04) 100%)';

  const bgColor = isBacking
    ? 'rgba(245, 240, 232, 1)' // warm paper back
    : isTrace
    ? 'rgba(255,255,255,0.50)' // tracing paper
    : 'rgba(250, 249, 246, 1)'; // standard page

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Page below showing through trace */}
      {isTrace && pageBelow && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            // rendered at reduced opacity as part of the trace bleed
          }}
        >
          <img
            src={pageBelow.src}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.45,
            }}
          />
        </div>
      )}

      {/* Main page image */}
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
            // For trace, image is at full opacity (already isolated from bg opacity via rgba bg, not css opacity)
            opacity: 1,
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
            color: 'rgba(0,0,0,0.12)',
            fontSize: '0.75rem',
            fontFamily: 'sans-serif',
            letterSpacing: '0.1em',
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

      {/* Edge vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: edgeGradient,
          pointerEvents: 'none',
        }}
      />

      {/* Paper texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'300\' height=\'300\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />
    </div>
  );
}
