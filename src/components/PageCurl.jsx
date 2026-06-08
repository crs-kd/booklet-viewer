import React from 'react';
import Page from './Page.jsx';

/**
 * PageCurl — 3D page-turn animation.
 *
 * Layers (bottom → top inside the half-width wrapper):
 *  1. pageBelow  — the page being revealed underneath the turning sheet (static)
 *  2. Turning sheet — 3D rotateY, front + back face
 *     Front face: the page being turned (turningPage)
 *     Back face:  the content on the other side of the physical sheet (backingPage),
 *                 shown with scaleX(-1) to counteract the rotateY(180deg) flip
 *  3. Cast shadow — sweeps left as the page lifts
 *  4. Fold highlight — bright edge at the spine during the turn
 */
export default function PageCurl({ turningPage, backingPage, pageBelow, side, progress, width, height }) {
  const isRightPage = side === 'right';

  // Right page turns left: 0 → -180°. Left page turns right: 0 → +180°.
  const rotateY = isRightPage ? progress * -180 : progress * 180;

  // Peak at progress=0.5 (page vertical)
  const shadowIntensity = Math.sin(Math.abs(progress) * Math.PI);

  return (
    // Wrapper sits over the correct half of the spread
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: isRightPage ? '50%' : 0,
        width: '50%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* ── Layer 1: revealed page behind the turning sheet ── */}
      {pageBelow && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <Page page={pageBelow} side={isRightPage ? 'right' : 'left'} />
        </div>
      )}

      {/* ── Layer 2: the turning sheet (3D) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: width * 3,
          perspectiveOrigin: isRightPage ? '0% 50%' : '100% 50%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transformOrigin: isRightPage ? 'left center' : 'right center',
            transform: `rotateY(${rotateY}deg)`,
          }}
        >
          {/* Front face — the page being turned, visible 0°→90° */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              overflow: 'hidden',
            }}
          >
            <Page page={turningPage} side={side} />
          </div>

          {/* Back face — opposite side of the physical sheet, visible 90°→180° */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              // This rotateY(180deg) pre-flips the face; combined with parent's -180 → net 0 facing viewer.
              // The x-axis is mirrored by the combined rotation, so we counteract with scaleX(-1) on content.
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              overflow: 'hidden',
              backgroundColor: '#f5f0e8', // warm paper fallback if backingPage is null
            }}
          >
            {backingPage ? (
              // scaleX(-1) counteracts the horizontal mirror introduced by rotateY(180deg)
              <div style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}>
                <Page page={backingPage} side={isRightPage ? 'left' : 'right'} />
              </div>
            ) : (
              <Page page={null} side={isRightPage ? 'left' : 'right'} isBacking />
            )}
          </div>

          {/* Fold highlight — bright edge at the crease */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: isRightPage
                ? `linear-gradient(to left,  rgba(255,255,255,${shadowIntensity * 0.4}) 0%, transparent 20%)`
                : `linear-gradient(to right, rgba(255,255,255,${shadowIntensity * 0.4}) 0%, transparent 20%)`,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        </div>
      </div>

      {/* ── Layer 3: shadow cast onto the page below ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: isRightPage ? 0 : 'auto',
          right: isRightPage ? 'auto' : 0,
          // Shadow shrinks as the page lifts (less contact with surface below)
          width: `${(1 - Math.abs(progress)) * 100}%`,
          height: '100%',
          background: isRightPage
            ? `linear-gradient(to right, rgba(0,0,0,${shadowIntensity * 0.22}) 0%, transparent 100%)`
            : `linear-gradient(to left,  rgba(0,0,0,${shadowIntensity * 0.22}) 0%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 11,
        }}
      />
    </div>
  );
}
