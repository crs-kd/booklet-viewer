import React, { useState, useRef, useCallback, useEffect } from 'react';
import Page from './Page.jsx';

/**
 * PageCurl handles the animated page turn.
 *
 * The animation uses CSS 3D perspective + rotateY on the page half.
 * The page is anchored at the spine (left edge for right-page turn, right edge for left-page turn).
 *
 * direction: 'ltr' (right page turns left, advancing) | 'rtl' (left page turns right, going back)
 * progress: 0 = flat, 1 = fully turned (180 deg)
 */
export default function PageCurl({
  turningPage,
  backingPage,
  pageBelow,
  side, // 'left' | 'right' — which page is turning
  progress, // 0..1
  width,
  height,
}) {
  // For a right-page turning forward: it rotates from 0 → -180deg around Y at its left edge
  // For a left-page turning backward: it rotates from 0 → 180deg around Y at its right edge
  const isRightPage = side === 'right';
  const rotateY = isRightPage ? progress * -180 : progress * 180;

  // Show backing (back of page) when past 90 degrees
  const showBacking = Math.abs(rotateY) > 90;

  // During backing phase, the image appears mirrored (physically correct)
  const backingRotate = isRightPage ? -180 - rotateY : 180 - rotateY;

  // Shadow intensity based on progress — peaks at 0.5 (page vertical)
  const shadowIntensity = Math.sin(Math.abs(progress) * Math.PI);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        // The turning page occupies the correct half
        left: isRightPage ? '50%' : 0,
        width: '50%',
        height: '100%',
        // Perspective origin at the spine edge
        perspective: width * 3,
        perspectiveOrigin: isRightPage ? '0% 50%' : '100% 50%',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* Cast shadow on pages below */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: isRightPage ? 0 : 'auto',
          right: isRightPage ? 'auto' : 0,
          width: `${(1 - Math.abs(progress)) * 100}%`,
          height: '100%',
          background: isRightPage
            ? `linear-gradient(to right, rgba(0,0,0,${shadowIntensity * 0.25}) 0%, transparent 100%)`
            : `linear-gradient(to left, rgba(0,0,0,${shadowIntensity * 0.25}) 0%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* The turning page itself */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transformOrigin: isRightPage ? 'left center' : 'right center',
          transform: `rotateY(${rotateY}deg)`,
          transition: 'none', // Controlled by parent
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {!showBacking && (
            <Page
              page={turningPage}
              side={side}
              isTrace={turningPage?.isTrace}
              pageBelow={pageBelow}
            />
          )}
        </div>

        {/* Back face — shown when page is flipped past 90° */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {showBacking && (
            <Page
              page={null}
              side={isRightPage ? 'left' : 'right'}
              isBacking
            />
          )}
        </div>

        {/* Curl lighting — bright line at the fold edge */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isRightPage
              ? `linear-gradient(to left, rgba(255,255,255,${shadowIntensity * 0.4}) 0%, transparent 20%)`
              : `linear-gradient(to right, rgba(255,255,255,${shadowIntensity * 0.4}) 0%, transparent 20%)`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}
