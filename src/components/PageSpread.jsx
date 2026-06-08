import React, { useState, useRef, useCallback } from 'react';
import Page from './Page.jsx';
import PageCurl from './PageCurl.jsx';
import RingBinding from './RingBinding.jsx';
import PerfectBinding from './PerfectBinding.jsx';
import { useBooklet } from '../context/BookletContext.jsx';

const ANIM_DURATION = 700; // ms

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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
    totalSpreads,
  } = useBooklet();

  const [turning, setTurning] = useState(null);
  // turning: { direction: 'next'|'prev', progress: 0..1, animating: bool }

  const animFrameRef = useRef(null);
  const dragRef = useRef(null);

  const { left, right, leftIndex, rightIndex, pageBelowLeft, pageBelowRight } = getCurrentPages();

  // Pages for the spread AFTER the current one (used to show what's revealed during curl)
  // With the new indexing: rightIdx = spreadIndex*2-1, leftIdx = spreadIndex*2-2
  // Next spread (spreadIndex+1): right = pages[rightIndex+2], left = pages[rightIndex+1]
  const nextRight = pages[rightIndex + 2] ?? null;
  const nextLeft  = pages[rightIndex + 1] ?? null;

  // Prev spread (spreadIndex-1): right = pages[rightIndex-2], left = pages[leftIndex-2]
  // Spread 1 has left=null; going back to spread 1 from spread 2 (leftIndex=2) also gives null.
  // leftIndex=2 → leftIndex-2=0 which is pages[0]=cover — must stay null.
  // So the condition is leftIndex > 2 (i.e. currently at spread 3+).
  const prevRight = pages[rightIndex - 2] ?? null;
  const prevLeft  = leftIndex > 2 ? (pages[leftIndex - 2] ?? null) : null;

  const animateTurn = useCallback((direction, onDone) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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
    if (spreadIndex <= 1) {
      animateTurn('prev', goPrev);
    } else {
      animateTurn('prev', goPrev);
    }
  }, [turning, spreadIndex, animateTurn, goPrev]);

  // Drag-to-turn
  const handleMouseDown = useCallback((e, side) => {
    if (turning?.animating) return;
    const startX = e.clientX;
    dragRef.current = { startX, side, progress: 0, direction: side === 'right' ? 'next' : 'prev' };

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const progress =
        side === 'right'
          ? Math.max(0, Math.min(1, -dx / (width / 2)))
          : Math.max(0, Math.min(1, dx / (width / 2)));
      dragRef.current.progress = progress;
      setTurning({ direction: dragRef.current.direction, progress, animating: false });
    };

    const onUp = () => {
      if (!dragRef.current) return;
      const { progress, direction } = dragRef.current;
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      const startP = progress;
      const snapForward = progress > 0.35;

      const snapStart = performance.now();
      const snapDur = snapForward ? (1 - startP) * ANIM_DURATION : startP * ANIM_DURATION;

      const step = (now) => {
        const t = Math.min((now - snapStart) / Math.max(snapDur, 1), 1);
        const p = snapForward
          ? startP + (1 - startP) * easeInOut(t)
          : startP * (1 - easeInOut(t));
        setTurning({ direction, progress: p, animating: true });
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setTurning(null);
          if (snapForward) direction === 'next' ? goNext() : goPrev();
        }
      };
      animFrameRef.current = requestAnimationFrame(step);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [turning, width, goNext, goPrev]);

  const showCurl = turning !== null;
  const curlSide = turning?.direction === 'next' ? 'right' : 'left';

  // The page physically turning
  const curlingPage = turning?.direction === 'next' ? right : left;
  // The page revealed beneath the curl on the same side
  const revealedPage = turning?.direction === 'next' ? nextRight : prevLeft;

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
        filter:
          'drop-shadow(0 20px 60px rgba(0,0,0,0.45)) drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
      }}
    >
      {/* LEFT PAGE */}
      <div
        style={{
          width: '50%',
          height: '100%',
          position: 'relative',
          cursor: canGoPrev ? 'pointer' : 'default',
          borderRadius: '2px 0 0 2px',
          overflow: 'hidden',
        }}
        onMouseDown={canGoPrev ? (e) => handleMouseDown(e, 'left') : undefined}
        onClick={canGoPrev && !turning ? handlePrev : undefined}
      >
        <Page
          page={left}
          side="left"
          isTrace={left?.isTrace}
          pageBelow={pageBelowLeft}
        />
        {canGoPrev && !turning && <div style={hintArrowStyle('left')}>‹</div>}
      </div>

      {/* RIGHT PAGE */}
      <div
        style={{
          width: '50%',
          height: '100%',
          position: 'relative',
          cursor: canGoNext ? 'pointer' : 'default',
          borderRadius: '0 2px 2px 0',
          overflow: 'hidden',
        }}
        onMouseDown={canGoNext ? (e) => handleMouseDown(e, 'right') : undefined}
        onClick={canGoNext && !turning ? handleNext : undefined}
      >
        <Page
          page={right}
          side="right"
          isTrace={right?.isTrace}
          pageBelow={pageBelowRight}
        />
        {canGoNext && !turning && <div style={hintArrowStyle('right')}>›</div>}
      </div>

      {/* Page curl animation */}
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
    </div>
  );
}

function hintArrowStyle(side) {
  return {
    position: 'absolute',
    top: '50%',
    [side === 'left' ? 'left' : 'right']: 10,
    transform: 'translateY(-50%)',
    fontSize: 30,
    color: 'rgba(255,255,255,0.45)',
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily: 'sans-serif',
    lineHeight: 1,
  };
}
