import React from 'react';

/**
 * The closed book view — shows only the front cover as a single page,
 * slightly rotated for perspective (as if viewed from above at an angle).
 */
export default function ClosedBook({ coverPage, width, height, onOpen }) {
  const coverBg = coverPage?.src
    ? `url(${coverPage.src})`
    : 'linear-gradient(135deg, #2c3e50, #3d5166)';

  return (
    <div
      style={{
        width,
        height,
        cursor: 'pointer',
        transform: 'perspective(900px) rotateX(6deg) rotateY(-4deg)',
        transformOrigin: 'center center',
        position: 'relative',
        filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.55)) drop-shadow(0 6px 18px rgba(0,0,0,0.35))',
        transition: 'transform 0.3s ease',
      }}
      onClick={onOpen}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform =
          'perspective(900px) rotateX(4deg) rotateY(-2deg) translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform =
          'perspective(900px) rotateX(6deg) rotateY(-4deg)';
      }}
    >
      {/* Book spine (left edge) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: -16,
          width: 16,
          height: '100%',
          background: 'linear-gradient(to right, #1a2530, #2c3e50)',
          transformOrigin: 'right center',
          transform: 'perspective(200px) rotateY(70deg)',
          borderRadius: '2px 0 0 2px',
        }}
      />

      {/* Cover */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: coverBg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: coverPage?.src ? undefined : '#2c3e50',
          borderRadius: '0 2px 2px 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Edge lighting */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.08) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* "Click to open" prompt when no cover image */}
        {!coverPage?.src && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)',
              fontFamily: "'Georgia', serif",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 18, letterSpacing: '0.15em', fontWeight: 300 }}>
              BOOKLET VIEWER
            </div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', opacity: 0.6 }}>
              CLICK TO OPEN
            </div>
          </div>
        )}
      </div>

      {/* Page stack visible at right edge — implies page thickness */}
      <div
        style={{
          position: 'absolute',
          top: 2,
          right: -3,
          width: 4,
          height: 'calc(100% - 4px)',
          background:
            'repeating-linear-gradient(to bottom, #e8e4de 0px, #e8e4de 2px, #d0ccc8 2px, #d0ccc8 3px)',
          borderRadius: '0 1px 1px 0',
        }}
      />
    </div>
  );
}
