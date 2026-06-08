import React, { useState, useRef, useCallback } from 'react';
import Page from './Page.jsx';
import PageCurl from './PageCurl.jsx';
import RingBinding from './RingBinding.jsx';
import PerfectBinding from './PerfectBinding.jsx';
import TraceInsert from './TraceInsert.jsx';
import { useBooklet } from '../context/BookletContext.jsx';

const ANIM_DURATION = 700;

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function PageHalf({ page, side, canInteract, onMouseDown, onClick, showArrow }) {
  return (
    <div
      style={{
        width: '50%',
        height: '100%',
        position: 'relative',
        cursor: canInteract ? 'pointer' : 'default',
        borderRadius: side === 'left' ? '2px 0 0 2px' : '0 2px 2px 0',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      onMouseDown={canInteract ? onMouseDown : undefined}
      onClick={canInteract ? onClick : undefined}
    >
      <Page page={page} side={side} />
      {showArrow && (
        <div style={{ ...hintArrow, [side === 'left' ? 'left' : 'right']: 10 }}>
          {side === 'left' ? '‹' : '›'}
        </div>
      )}
    </div>
  );
}

export default function PageSpread({ width, height }) {
  const {
    pages,
    spreadIndex,
    isOpen,
    binding,
    goNext,
    goPrev,
    getCurrentPages,
    getTraceInsert,
    toggleTraceTurned,
    totalSpreads,
  } = useBooklet();

  const [turning, setTurning] = useState(null);
  const animFrameRef = useRef(null);
  const dragRef = useRef(null);

  const { left, right, leftIndex, rightIndex } = getCurrentPages();
  const traceInsert = getTraceInsert(spreadIndex);

  // Next spread pages (for curl reveal)
  const nextLeft  = pages[leftIndex  + 2] ?? null;
  const nextRight = pages[rightIndex + 2] ?? null;

  // Prev spread pages (for curl reveal)
  // At spread 1 (leftIndex=1), going prev closes — no prev left to reveal.
  const prevLeft  = leftIndex >= 3 ? (pages[leftIndex  - 2] ?? null) : null;
  const prevRight = pages[rightIndex - 2] ?? null;

  const animateTurn = useCallback((direction, onDone) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const start = performance.now();
    const step = (now) => {
      const raw = Math.min((now - start) / ANIM_DURATION, 1);
      setTurning({ direction, progress: easeInOut(raw), animating: true });
      if (raw < 1) animFrameRef.current = requestAnimationFrame(step);
      else { setTurning(null); onDone(); }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  const handleNext = useCallback(() => {
    if (turning?.animating || spreadIndex >= totalSpreads) return;
    animateTurn('next', goNext);
  }, [turning, spreadIndex, totalSpreads, animateTurn, goNext]);

  const handlePrev = useCallback(() => {
    if (turning?.animating) return;
    animateTurn('prev', goPrev);
  }, [turning, animateTurn, goPrev]);

  const handleMouseDown = useCallback((e, side) => {
    if (turning?.animating) return;
    const startX = e.clientX;
    const direction = side === 'right' ? 'next' : 'prev';
    dragRef.current = { startX, direction };

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - startX;
      const progress = side === 'right'
        ? Math.max(0, Math.min(1, -dx / (width / 2)))
        : Math.max(0, Math.min(1,  dx / (width / 2)));
      dragRef.current.progress = progress;
      setTurning({ direction, progress, animating: false });
    };

    const onUp = () => {
      if (!dragRef.current) return;
      const { progress } = dragRef.current;
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      const snapForward = progress > 0.35;
      const startP = progress;
      const snapStart = performance.now();
      const snapDur = snapForward ? (1 - startP) * ANIM_DURATION : startP * ANIM_DURATION;

      const step = (now) => {
        const t = Math.min((now - snapStart) / Math.max(snapDur, 1), 1);
        const p = snapForward
          ? startP + (1 - startP) * easeInOut(t)
          : startP * (1 - easeInOut(t));
        setTurning({ direction, progress: p, animating: true });
        if (t < 1) animFrameRef.current = requestAnimationFrame(step);
        else {
          setTurning(null);
          if (snapForward) direction === 'next' ? goNext() : goPrev();
        }
      };
      animFrameRef.current = requestAnimationFrame(step);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [turning, width, goNext, goPrev]);

  const showCurl   = turning !== null;
  const curlSide   = turning?.direction === 'next' ? 'right' : 'left';
  const curlingPage = turning?.direction === 'next' ? right : left;

  // The page revealed from behind the turning sheet (destination spread's exposed page)
  const revealedPage = turning?.direction === 'next' ? nextRight : prevLeft;

  // The content printed on the OTHER SIDE of the physical sheet being turned.
  // next: turning right page (pages[rightIndex]) → back = pages[rightIndex+1] = left of next spread
  // prev: turning left page (pages[leftIndex])  → back = pages[leftIndex-1]  = right of prev spread
  const backingPage = turning?.direction === 'next'
    ? (pages[rightIndex + 1] ?? null)
    : (pages[leftIndex  - 1] ?? null);

  const canGoPrev = spreadIndex > 1 || isOpen;
  const canGoNext = spreadIndex < totalSpreads;

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        borderRadius: 2,
        overflow: 'visible',
        filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.45)) drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
      }}
    >
      <PageHalf
        page={left}
        side="left"
        canInteract={canGoPrev && !turning}
        onMouseDown={(e) => handleMouseDown(e, 'left')}
        onClick={handlePrev}
        showArrow={canGoPrev && !turning}
      />
      <PageHalf
        page={right}
        side="right"
        canInteract={canGoNext && !turning && !traceInsert}
        onMouseDown={(e) => !traceInsert && handleMouseDown(e, 'right')}
        onClick={!traceInsert ? handleNext : undefined}
        showArrow={canGoNext && !turning && !traceInsert}
      />

      {/* Trace insert overlay for this spread */}
      {traceInsert && (
        <TraceInsert
          insert={traceInsert}
          spreadWidth={width}
          height={height}
          onToggle={() => toggleTraceTurned(spreadIndex)}
        />
      )}

      {showCurl && (
        <PageCurl
          turningPage={curlingPage}
          backingPage={backingPage}
          pageBelow={revealedPage}
          side={curlSide}
          progress={turning.progress}
          width={width}
          height={height}
        />
      )}

      {binding === 'ring' ? (
        <RingBinding bookHeight={height} />
      ) : (
        <PerfectBinding bookHeight={height} />
      )}
    </div>
  );
}

const hintArrow = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 30,
  color: 'rgba(255,255,255,0.45)',
  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  pointerEvents: 'none',
  userSelect: 'none',
  fontFamily: 'sans-serif',
  lineHeight: 1,
};
