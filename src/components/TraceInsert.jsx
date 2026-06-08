import React, { useState, useRef, useEffect } from 'react';

const ANIM_DURATION = 500; // ms

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Trace insert overlay for a spread.
 *
 * When not turned: sits on the right half of the spread.
 *   - 50% white paper overlay on top of the right page
 *   - Insert image at 100% opacity
 *
 * When turned: sits on the left half, image mirrored (scaleX(-1)).
 *   - Physically: the tracing paper has been folded back over the left page.
 *
 * The turn animates as a CSS 3D rotateY around the spine edge.
 */
export default function TraceInsert({ insert, spreadWidth, height, onToggle }) {
  const { src, turned } = insert;
  const halfW = spreadWidth / 2;

  // animProgress: 0 = on right (not turned), 1 = on left (turned)
  const [animProgress, setAnimProgress] = useState(turned ? 1 : 0);
  const animRef = useRef(null);
  const prevTurned = useRef(turned);

  useEffect(() => {
    if (turned === prevTurned.current) return;
    prevTurned.current = turned;

    const startP = animProgress;
    const targetP = turned ? 1 : 0;
    const start = performance.now();
    const duration = ANIM_DURATION * Math.abs(targetP - startP);

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const step = (now) => {
      const t = Math.min((now - start) / Math.max(duration, 1), 1);
      setAnimProgress(startP + (targetP - startP) * easeInOut(t));
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [turned]);

  // rotateY: 0 = flat on right, -180 = flipped to left (pivoted at spine)
  const rotateY = animProgress * -180;
  const showFront = Math.abs(rotateY) <= 90;

  // Spine gradient direction: same as Page.jsx — shadow deepens toward the spine edge
  const spineGradient = 'linear-gradient(to right, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.06) 18%, transparent 55%)';

  return (
    // Wrapper: positioned at the right half, pivot at left edge (spine)
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        width: halfW,
        height,
        perspective: spreadWidth * 3,
        perspectiveOrigin: '0% 50%',
        zIndex: 15,
        pointerEvents: 'none', // handled per-face below
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transformOrigin: 'left center',
          transform: `rotateY(${rotateY}deg)`,
        }}
      >
        {/* FRONT FACE — visible when on the right (not turned) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.52)',
            overflow: 'hidden',
            cursor: 'pointer',
            pointerEvents: showFront ? 'auto' : 'none',
          }}
          onClick={onToggle}
          title="Click to turn trace insert"
        >
          <img
            src={src}
            alt="Trace insert"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Spine shadow */}
          <div style={{ position: 'absolute', inset: 0, background: spineGradient, pointerEvents: 'none' }} />
          {/* Turn hint */}
          {showFront && Math.abs(rotateY) < 5 && (
            <div style={hintStyle('left')}>← turn</div>
          )}
        </div>

        {/* BACK FACE — visible when flipped to the left (turned), image mirrored */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.52)',
            overflow: 'hidden',
            cursor: 'pointer',
            pointerEvents: !showFront ? 'auto' : 'none',
          }}
          onClick={onToggle}
          title="Click to turn trace insert back"
        >
          {/* Mirror the image horizontally — simulates viewing the print through the back of the paper */}
          <img
            src={src}
            alt="Trace insert (turned)"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
            }}
          />
          {/* Spine shadow (reversed — now the spine is on the right edge of the left half) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to left, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.06) 18%, transparent 55%)',
              pointerEvents: 'none',
            }}
          />
          {!showFront && Math.abs(rotateY) > 175 && (
            <div style={hintStyle('right')}>turn back →</div>
          )}
        </div>

        {/* Curl lighting — bright line at the fold */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to left, rgba(255,255,255,${
              Math.sin(Math.abs(animProgress) * Math.PI) * 0.35
            }) 0%, transparent 15%)`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

function hintStyle(side) {
  return {
    position: 'absolute',
    bottom: 12,
    [side]: 10,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'sans-serif',
    letterSpacing: '0.08em',
    pointerEvents: 'none',
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
  };
}
