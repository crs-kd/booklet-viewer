import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import PageSpread from './PageSpread.jsx';
import ClosedBook from './ClosedBook.jsx';
import ControlPanel from './ControlPanel.jsx';
import { useKeyboard } from '../hooks/useKeyboard.js';

export default function BookletViewer() {
  const {
    pages,
    pageSize,
    isOpen,
    spreadIndex,
    totalSpreads,
    PAGE_SIZES,
    openBook,
    closeBook,
    goNext,
    goPrev,
  } = useBooklet();

  const containerRef = useRef();
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useKeyboard({ onNext: goNext, onPrev: goPrev });

  // Compute pixel dimensions to fit the booklet in the viewport
  useEffect(() => {
    function compute() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const { width: pw, height: ph } = PAGE_SIZES[pageSize];
      const pageAspect = pw / ph;
      // Open spread = 2 pages side by side
      const spreadAspect = (pw * 2) / ph;

      // Available area (leave margin for controls/arrows)
      const availW = vw - 160; // room for arrows
      const availH = vh - 80;

      // Fit spread in available area
      let w, h;
      if (availW / spreadAspect <= availH) {
        w = availW;
        h = availW / spreadAspect;
      } else {
        h = availH;
        w = availH * spreadAspect;
      }

      setDims({ width: Math.floor(w), height: Math.floor(h), pageAspect });
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [pageSize, PAGE_SIZES]);

  const coverPage = pages[0] ?? null;

  const canGoNext = isOpen ? spreadIndex < totalSpreads : pages.length > 0;
  const canGoPrev = isOpen;

  return (
    <div style={outerWrap}>
      {/* Background surface */}
      <div style={surface} />

      {/* Main stage */}
      <div style={stage} ref={containerRef}>
        {/* Prev arrow */}
        <NavArrow direction="left" onClick={goPrev} disabled={!canGoPrev} />

        {/* Book */}
        <div style={{ position: 'relative' }}>
          {!isOpen ? (
            <ClosedBook
              coverPage={coverPage}
              width={dims.width / 2}
              height={dims.height}
              onOpen={openBook}
            />
          ) : (
            dims.width > 0 && (
              <PageSpread width={dims.width} height={dims.height} />
            )
          )}

          {/* Page indicator */}
          {isOpen && (
            <div style={pageIndicator}>
              {spreadIndex * 2 - 1}–{Math.min(spreadIndex * 2, pages.length)} / {pages.length}
              {'  ·  '}
              <span style={{ opacity: 0.6 }}>{PAGE_SIZES[pageSize].label}</span>
            </div>
          )}
        </div>

        {/* Next arrow */}
        <NavArrow direction="right" onClick={goNext} disabled={!canGoNext} />
      </div>

      {/* Close button */}
      {isOpen && (
        <button style={closeBtn} onClick={closeBook} title="Close book">
          ✕ Close
        </button>
      )}

      {/* Open hint when closed */}
      {!isOpen && (
        <div style={openHint}>Click the book to open  ·  → to turn pages</div>
      )}

      {/* Control panel */}
      <ControlPanel />
    </div>
  );
}

function NavArrow({ direction, onClick, disabled }) {
  return (
    <button
      style={{
        ...navArrow,
        opacity: disabled ? 0.2 : 0.7,
        cursor: disabled ? 'default' : 'pointer',
      }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  );
}

const outerWrap = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  background: '#5a5a5a',
};

const surface = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(ellipse at 50% 40%, #686868 0%, #4a4a4a 60%, #383838 100%)',
  // Subtle desk texture via noise
  backgroundBlendMode: 'multiply',
};

const stage = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  zIndex: 1,
};

const navArrow = {
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: 48,
  lineHeight: 1,
  padding: '0 8px',
  transition: 'opacity 0.2s',
  fontFamily: 'sans-serif',
};

const pageIndicator = {
  position: 'absolute',
  bottom: -32,
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: 12,
  color: 'rgba(255,255,255,0.5)',
  fontFamily: 'monospace',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const closeBtn = {
  position: 'fixed',
  bottom: 28,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 24,
  color: 'rgba(255,255,255,0.7)',
  fontSize: 12,
  padding: '8px 20px',
  cursor: 'pointer',
  letterSpacing: '0.08em',
  fontFamily: 'sans-serif',
  backdropFilter: 'blur(8px)',
  zIndex: 10,
  transition: 'background 0.2s',
};

const openHint = {
  position: 'fixed',
  bottom: 28,
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: 12,
  color: 'rgba(255,255,255,0.35)',
  fontFamily: 'sans-serif',
  letterSpacing: '0.08em',
  zIndex: 10,
};
