import React, { useEffect, useState } from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import PageSpread from './PageSpread.jsx';
import ClosedBook from './ClosedBook.jsx';
import ControlPanel from './ControlPanel.jsx';
import { useKeyboard } from '../hooks/useKeyboard.js';

export default function BookletViewer() {
  const {
    pages,
    pageSize,
    orientation,
    isOpen,
    spreadIndex,
    totalSpreads,
    PAGE_SIZES,
    panelOpen,
    openBook,
    closeBook,
    goNext,
    goPrev,
  } = useBooklet();

  // dims are recalculated whenever the panel opens/closes or window resizes.
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useKeyboard({ onNext: goNext, onPrev: goPrev });

  useEffect(() => {
    function compute() {
      // The stage occupies the full viewport minus the panel width (240px when open, 0 when closed).
      const panelW = panelOpen ? 240 : 0;
      const stageW = window.innerWidth - panelW;
      const stageH = window.innerHeight;

      let { width: pw, height: ph } = PAGE_SIZES[pageSize];
      if (orientation === 'landscape') [pw, ph] = [ph, pw];

      const spreadAspect = (pw * 2) / ph;

      // Leave room for nav arrows (80px each side) and vertical margin (80px)
      const availW = stageW - 160;
      const availH = stageH - 80;

      let w, h;
      if (availW / spreadAspect <= availH) {
        w = availW;
        h = availW / spreadAspect;
      } else {
        h = availH;
        w = availH * spreadAspect;
      }

      setDims({ width: Math.floor(w), height: Math.floor(h) });
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [pageSize, orientation, panelOpen, PAGE_SIZES]);

  const coverPage = pages[0] ?? null;
  const canGoNext = isOpen ? spreadIndex < totalSpreads : pages.length > 1;
  const canGoPrev = isOpen;
  const pageLabel = `Spread ${spreadIndex} / ${totalSpreads}`;

  return (
    <div style={outerWrap}>
      {/* Stage — fills everything left of the panel */}
      <div style={stageArea}>
        {/* Desk surface */}
        <div style={surface} />

        <div style={stage}>
          <NavArrow direction="left" onClick={goPrev} disabled={!canGoPrev} />

          <div style={{ position: 'relative' }}>
            {!isOpen ? (
              dims.width > 0 && (
                <ClosedBook
                  coverPage={coverPage}
                  width={dims.width / 2}
                  height={dims.height}
                  onOpen={openBook}
                />
              )
            ) : (
              dims.width > 0 && (
                <PageSpread width={dims.width} height={dims.height} />
              )
            )}

            {isOpen && dims.width > 0 && (
              <div style={pageIndicator}>
                {pageLabel}{'  ·  '}
                <span style={{ opacity: 0.55 }}>
                  {PAGE_SIZES[pageSize].label}{orientation === 'landscape' ? ' landscape' : ''}
                </span>
              </div>
            )}
          </div>

          <NavArrow direction="right" onClick={goNext} disabled={!canGoNext} />
        </div>

        {isOpen && (
          <button style={closeBtn} onClick={closeBook}>✕ Close</button>
        )}
        {!isOpen && (
          <div style={openHint}>Click the book to open · → to turn pages</div>
        )}
      </div>

      {/* Side panel — true sidebar, not an overlay */}
      <ControlPanel />
    </div>
  );
}

function NavArrow({ direction, onClick, disabled }) {
  return (
    <button
      style={{ ...navArrow, opacity: disabled ? 0.15 : 0.65, cursor: disabled ? 'default' : 'pointer' }}
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
  display: 'flex',           // panel sits as a flex sibling to the stage
  overflow: 'hidden',
};

const stageArea = {
  flex: 1,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 0,
};

const surface = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(ellipse at 50% 40%, #686868 0%, #4a4a4a 60%, #383838 100%)',
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
  flexShrink: 0,
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
  position: 'absolute',
  bottom: 28,
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
  zIndex: 2,
};

const openHint = {
  position: 'absolute',
  bottom: 28,
  fontSize: 12,
  color: 'rgba(255,255,255,0.35)',
  fontFamily: 'sans-serif',
  letterSpacing: '0.08em',
  zIndex: 2,
};
