import React, { useState, useRef, useCallback } from 'react';
import Page from './Page.jsx';
import PageCurl from './PageCurl.jsx';
import RingBinding from './RingBinding.jsx';
import PerfectBinding from './PerfectBinding.jsx';
import { useBooklet } from '../context/BookletContext.jsx';

const ANIM_DURATION = 700; // ms

export default function PageSpread({ width, height }) {
  const {
    pages,
    spreadIndex,
    isOpen,
    binding,
    goNext,
    goPrev,
    getCurrentPages,
    totalSpreads,
  } = useBooklet();

  const [turning, setTurning] = useState(null);
  // turning: { direction: 'next'|'prev', progress: 0..1, animating: bool }

  const animFrameRef = useRef(null);
  const dragRef = useRef(null);

  const { left, right, leftIndex, rightIndex } = getCurrentPages();

  // Page that was previously on the opposite side before turn
  // When turning next: the right page flies to the left side
  // When turning prev: the left page flies to the right side
  const prevLeft = pages[(spreadIndex - 2) * 2] ?? null;
  const prevRight = pages[(spreadIndex - 2) * 2 + 1] ?? null;
  const nextLeft = pages[spreadIndex * 2] ?? null;
  const nextRight = pages[spreadIndex * 2 + 1] ?? null;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  const animateTurn = useCallback((direction, onDone) => {
    const start = performance.now();
    const step = (now) => {
      const raw = Math.min((now - start) / ANIM_DURATION, 1);
      const progress = easeInOut(raw);
      setTurning({ direction, progress, animating: true });
      if (raw < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setTurning(null);
        onDone();
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  const handleNext = useCallback(() => {
    if (turning?.animating) return;
    if (spreadIndex >= totalSpreads) return;
    animateTurn('next', goNext);
  }, [turning, spreadIndex, totalSpreads, animateTurn, goNext]);

  const handlePrev = useCallback(() => {
    if (turning?.animating) return;
    if (spreadIndex <= 0) return;
    animateTurn('prev', goPrev);
  }, [turning, spreadIndex, animateTurn, goPrev]);

  // Drag-to-turn on the page edges
  const handleMouseDown = useCallback((e, side) => {
    if (turning?.animating) return;
    const startX = e.clientX;
    dragRef.current = { startX, side, progress: 0 };

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      // Dragging left on right page = turning next
      // Dragging right on left page = turning prev
      let progress = 0;
      if (side === 'right') {
        progress = Math.max(0, Math.min(1, -dx / (width / 2)));
        dragRef.current.direction = 'next';
      } else {
        progress = Math.max(0, Math.min(1, dx / (width / 2)));
        dragRef.current.direction = 'prev';
      }
      dragRef.current.progress = progress;
      setTurning({ direction: dragRef.current.direction, progress, animating: false });
    };

    const onUp = () => {
      if (!dragRef.current) return;
      const { progress, direction } = dragRef.current;
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      if (progress > 0.35) {
        // Snap forward
        const startP = progress;
        const start = performance.now();
        const snapDur = (1 - startP) * ANIM_DURATION;
        const step = (now) => {
          const t = Math.min((now - start) / snapDur, 1);
          const p = startP + (1 - startP) * easeInOut(t);
          setTurning({ direction, progress: p, animating: true });
          if (t < 1) {
            animFrameRef.current = requestAnimationFrame(step);
          } else {
            setTurning(null);
            direction === 'next' ? goNext() : goPrev();
          }
        };
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        // Snap back
        const startP = progress;
        const start = performance.now();
        const snapDur = startP * ANIM_DURATION;
        const step = (now) => {
          const t = Math.min((now - start) / snapDur, 1);
          const p = startP * (1 - easeInOut(t));
          setTurning({ direction, progress: p, animating: true });
          if (t < 1) {
            animFrameRef.current = requestAnimationFrame(step);
          } else {
            setTurning(null);
          }
        };
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [turning, width, goNext, goPrev]);

  const showCurl = turning !== null;
  const curlSide = turning?.direction === 'next' ? 'right' : 'left';

  // The page that is currently turning
  const curlingPage = turning?.direction === 'next' ? right : left;
  // The page that will be revealed as the curl lands
  const revealedPage = turning?.direction === 'next' ? nextLeft : prevRight;

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        borderRadius: 2,
        overflow: 'visible',
        // Lift the whole booklet off the background
        filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.45)) drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
      }}
    >
      {/* LEFT PAGE */}
      <div
        style={{
          width: '50%',
          height: '100%',
          position: 'relative',
          cursor: isOpen && spreadIndex > 1 ? 'pointer' : 'default',
          borderRadius: '2px 0 0 2px',
          overflow: 'hidden',
        }}
        onMouseDown={isOpen && spreadIndex > 1 ? (e) => handleMouseDown(e, 'left') : undefined}
        onClick={isOpen && spreadIndex > 1 ? handlePrev : undefined}
      >
        <Page page={left} side="left" isTrace={left?.isTrace} />

        {/* Click zone hint arrow */}
        {isOpen && spreadIndex > 1 && !turning && (
          <div style={hintArrowStyle('left')}>‹</div>
        )}
      </div>

      {/* RIGHT PAGE */}
      <div
        style={{
          width: '50%',
          height: '100%',
          position: 'relative',
          cursor: spreadIndex < totalSpreads ? 'pointer' : 'default',
          borderRadius: '0 2px 2px 0',
          overflow: 'hidden',
        }}
        onMouseDown={spreadIndex < totalSpreads ? (e) => handleMouseDown(e, 'right') : undefined}
        onClick={spreadIndex < totalSpreads ? handleNext : undefined}
      >
        <Page page={right} side="right" isTrace={right?.isTrace} />

        {spreadIndex < totalSpreads && !turning && (
          <div style={hintArrowStyle('right')}>›</div>
        )}
      </div>

      {/* Page curl animation layer */}
      {showCurl && (
        <PageCurl
          turningPage={curlingPage}
          pageBelow={revealedPage}
          side={curlSide}
          progress={turning.progress}
          width={width}
          height={height}
        />
      )}

      {/* Binding */}
      {binding === 'ring' ? (
        <RingBinding bookHeight={height} />
      ) : (
        <PerfectBinding bookHeight={height} />
      )}

      {/* Centre gutter shadow over both pages */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 40,
          height: '100%',
          background:
            'linear-gradient(to bottom, transparent, transparent), radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
    </div>
  );
}

function hintArrowStyle(side) {
  return {
    position: 'absolute',
    top: '50%',
    [side === 'left' ? 'left' : 'right']: 8,
    transform: 'translateY(-50%)',
    fontSize: 28,
    color: 'rgba(255,255,255,0.5)',
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily: 'sans-serif',
    lineHeight: 1,
  };
}
