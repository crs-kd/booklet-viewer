import React, { useRef, useCallback } from 'react';
import { useBooklet } from '../context/BookletContext.jsx';

// ─── SpreadCard ──────────────────────────────────────────────────────────────

function SpreadCard({ spreadN, leftPage, rightPage, traceInsert, pageAspect, onAddTrace, onRemoveTrace }) {
  const traceFileRef = useRef();

  const pickTraceFile = () => traceFileRef.current?.click();

  const handleTraceFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onAddTrace(spreadN, ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Thumbnail dimensions — match the page aspect ratio, fit in ~88px width each
  const thumbW = 82;
  const thumbH = Math.round(thumbW / pageAspect);

  return (
    <div style={spreadCard}>
      <div style={spreadLabel}>Spread {spreadN}</div>

      {/* Page pair thumbnails */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <PageThumb page={leftPage} label="L" width={thumbW} height={thumbH} />
        <PageThumb page={rightPage} label="R" width={thumbW} height={thumbH} />
      </div>

      {/* Trace insert slot — aligned under the right page */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        {!traceInsert ? (
          <>
            <button style={addTraceBtn} onClick={pickTraceFile}>
              + insert trace
            </button>
            <input
              ref={traceFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleTraceFile}
            />
          </>
        ) : (
          <div style={traceRow}>
            <div style={{ ...traceThumb, width: thumbW, height: thumbH }}>
              <img
                src={traceInsert.src}
                alt="Trace insert"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={traceBadge}>T</div>
              {traceInsert.turned && <div style={turnedBadge}>↩</div>}
            </div>
            <button style={removeTraceBtn} onClick={() => onRemoveTrace(spreadN)} title="Remove trace insert">×</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PageThumb({ page, label, width, height }) {
  return (
    <div style={{ ...thumbBase, width, height }}>
      {page?.src ? (
        <img src={page.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={blankThumb}>{label}</div>
      )}
    </div>
  );
}

// ─── ControlPanel ─────────────────────────────────────────────────────────────

export default function ControlPanel() {
  const {
    pages,
    pageSize,
    orientation,
    binding,
    panelOpen,
    traceInserts,
    PAGE_SIZES,
    BINDING_TYPES,
    totalSpreads,
    addPages,
    removePage,
    reorderPages,
    addTraceInsert,
    removeTraceInsert,
    setPageSize,
    setOrientation,
    setBinding,
    togglePanel,
  } = useBooklet();

  const fileRef  = useRef();
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const { width: pw, height: ph } = PAGE_SIZES[pageSize];
  const pageAspect = orientation === 'landscape' ? ph / pw : pw / ph;

  const handleFiles = useCallback((files) => {
    const readers = Array.from(files).map(
      (file) => new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.readAsDataURL(file);
      })
    );
    Promise.all(readers).then(addPages);
  }, [addPages]);

  const onDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };

  const dragStart = (i) => { dragItem.current = i; };
  const dragEnter = (i) => { dragOver.current = i; };
  const dragEnd   = () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return;
    const copy = [...pages];
    copy.splice(dragOver.current, 0, copy.splice(dragItem.current, 1)[0]);
    reorderPages(copy);
    dragItem.current = null;
    dragOver.current = null;
  };

  const getTraceForSpread = (n) => traceInserts.find((t) => t.spreadIndex === n) ?? null;

  return (
    <div style={panelWrap(panelOpen)}>
      {/* Collapse tab */}
      <button style={toggleTab} onClick={togglePanel} title={panelOpen ? 'Collapse' : 'Expand'}>
        {panelOpen ? '›' : '‹'}
      </button>

      {panelOpen && (
        <div style={panelInner}>

          {/* ── Settings ── */}
          <div style={sectionTitle}>SETTINGS</div>

          <div style={sectionLabel}>Page Size</div>
          <div style={buttonGroup}>
            {Object.keys(PAGE_SIZES).map((k) => (
              <button key={k} style={optBtn(pageSize === k)} onClick={() => setPageSize(k)}>
                {PAGE_SIZES[k].label}
              </button>
            ))}
          </div>

          <div style={sectionLabel}>Orientation</div>
          <div style={buttonGroup}>
            <button style={optBtn(orientation === 'portrait')}  onClick={() => setOrientation('portrait')}>Portrait</button>
            <button style={optBtn(orientation === 'landscape')} onClick={() => setOrientation('landscape')}>Landscape</button>
          </div>

          <div style={sectionLabel}>Binding</div>
          <div style={buttonGroup}>
            {Object.keys(BINDING_TYPES).map((k) => (
              <button key={k} style={optBtn(binding === k)} onClick={() => setBinding(k)}>
                {BINDING_TYPES[k].label}
              </button>
            ))}
          </div>

          {/* ── Spreads ── */}
          <div style={{ ...sectionTitle, marginTop: 20 }}>SPREADS</div>

          {pages.length === 0 && (
            <div style={emptyNote}>Upload pages below to begin</div>
          )}

          {/* Cover card */}
          {pages[0] && (
            <div style={{ ...spreadCard, marginBottom: 6 }}>
              <div style={spreadLabel}>Cover</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <PageThumb
                  page={pages[0]}
                  label="C"
                  width={82}
                  height={Math.round(82 / pageAspect)}
                />
              </div>
            </div>
          )}

          {/* Spread cards */}
          {Array.from({ length: totalSpreads }, (_, i) => i + 1).map((n) => (
            <SpreadCard
              key={n}
              spreadN={n}
              leftPage={pages[n * 2 - 1] ?? null}
              rightPage={pages[n * 2] ?? null}
              traceInsert={getTraceForSpread(n)}
              pageAspect={pageAspect}
              onAddTrace={addTraceInsert}
              onRemoveTrace={removeTraceInsert}
            />
          ))}

          {/* ── Pages (upload + reorder) ── */}
          <div style={{ ...sectionTitle, marginTop: 20 }}>PAGES</div>

          <div
            style={dropZone}
            onClick={() => fileRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>+</div>
            <div style={{ fontSize: 11 }}>Drop images or click to upload</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)} />

          <div style={pageList}>
            {pages.map((page, i) => (
              <div
                key={page.id}
                draggable
                onDragStart={() => dragStart(i)}
                onDragEnter={() => dragEnter(i)}
                onDragEnd={dragEnd}
                style={pageRow}
              >
                <span style={dragHandle}>⠿</span>
                <div style={{ ...thumbBase, width: 28, height: 36, flexShrink: 0 }}>
                  <img src={page.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={pageNumLabel}>{i === 0 ? 'cvr' : `p${i}`}</div>
                <button style={removeBtn} onClick={() => removePage(page.id)} title="Remove">×</button>
              </div>
            ))}
            {pages.length === 0 && (
              <div style={emptyNote}>No pages yet</div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const panelWrap = (open) => ({
  position: 'relative',
  width: open ? 264 : 36,
  height: '100vh',
  flexShrink: 0,
  backgroundColor: 'rgba(16,18,22,0.98)',
  borderLeft: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'row',
  overflow: 'hidden',
  transition: 'width 0.25s ease',
  zIndex: 10,
});

const toggleTab = {
  width: 36,
  height: '100%',
  flexShrink: 0,
  background: 'none',
  border: 'none',
  borderRight: '1px solid rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.45)',
  fontSize: 16,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const panelInner = {
  flex: 1,
  minWidth: 0,
  padding: '16px 14px',
  overflowY: 'auto',
  overflowX: 'hidden',
};

const sectionTitle = {
  fontSize: 9,
  letterSpacing: '0.15em',
  color: 'rgba(255,255,255,0.35)',
  marginBottom: 8,
  fontFamily: 'sans-serif',
};

const sectionLabel = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.5)',
  marginTop: 10,
  marginBottom: 5,
  fontFamily: 'sans-serif',
};

const buttonGroup = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 5,
  marginBottom: 2,
};

const optBtn = (active) => ({
  padding: '4px 9px',
  fontSize: 11,
  fontFamily: 'sans-serif',
  border: active ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.12)',
  borderRadius: 5,
  background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
  cursor: 'pointer',
});

const spreadCard = {
  background: 'rgba(255,255,255,0.04)',
  borderRadius: 8,
  padding: '10px 10px 10px',
  marginBottom: 8,
};

const spreadLabel = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.35)',
  fontFamily: 'sans-serif',
  letterSpacing: '0.08em',
  marginBottom: 7,
};

const thumbBase = {
  borderRadius: 3,
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.07)',
  flexShrink: 0,
};

const blankThumb = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 9,
  color: 'rgba(255,255,255,0.2)',
  fontFamily: 'sans-serif',
};

const addTraceBtn = {
  fontSize: 10,
  padding: '4px 8px',
  borderRadius: 5,
  border: '1px dashed rgba(100,180,255,0.3)',
  background: 'transparent',
  color: 'rgba(100,180,255,0.6)',
  cursor: 'pointer',
  fontFamily: 'sans-serif',
  letterSpacing: '0.04em',
};

const traceRow = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 6,
};

const traceThumb = {
  borderRadius: 3,
  overflow: 'hidden',
  background: 'rgba(100,180,255,0.1)',
  border: '1px solid rgba(100,180,255,0.25)',
  flexShrink: 0,
  position: 'relative',
};

const traceBadge = {
  position: 'absolute',
  top: 2,
  right: 2,
  background: 'rgba(100,180,255,0.8)',
  color: '#fff',
  fontSize: 7,
  padding: '1px 3px',
  borderRadius: 2,
  fontFamily: 'sans-serif',
  fontWeight: 'bold',
};

const turnedBadge = {
  position: 'absolute',
  bottom: 2,
  left: 2,
  background: 'rgba(255,160,50,0.85)',
  color: '#fff',
  fontSize: 9,
  padding: '1px 3px',
  borderRadius: 2,
  fontFamily: 'sans-serif',
};

const removeTraceBtn = {
  background: 'none',
  border: 'none',
  color: 'rgba(255,100,100,0.5)',
  fontSize: 18,
  cursor: 'pointer',
  lineHeight: 1,
  padding: '0 2px',
  flexShrink: 0,
  alignSelf: 'center',
};

const dropZone = {
  border: '1px dashed rgba(255,255,255,0.18)',
  borderRadius: 7,
  padding: '12px 0',
  textAlign: 'center',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.4)',
  fontFamily: 'sans-serif',
  marginBottom: 10,
};

const pageList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  maxHeight: 240,
  overflowY: 'auto',
};

const pageRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 4px',
  borderRadius: 5,
  background: 'rgba(255,255,255,0.03)',
  cursor: 'grab',
};

const dragHandle = {
  color: 'rgba(255,255,255,0.2)',
  fontSize: 13,
  cursor: 'grab',
  flexShrink: 0,
};

const pageNumLabel = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.35)',
  fontFamily: 'monospace',
  flexShrink: 0,
  width: 24,
};

const removeBtn = {
  marginLeft: 'auto',
  background: 'none',
  border: 'none',
  color: 'rgba(255,100,100,0.45)',
  fontSize: 16,
  cursor: 'pointer',
  lineHeight: 1,
  padding: '0 2px',
  flexShrink: 0,
};

const emptyNote = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.25)',
  fontFamily: 'sans-serif',
  padding: '8px 0',
  textAlign: 'center',
};
