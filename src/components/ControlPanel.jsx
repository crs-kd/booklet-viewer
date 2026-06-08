import React, { useRef, useState, useCallback } from 'react';
import { useBooklet } from '../context/BookletContext.jsx';

export default function ControlPanel() {
  const {
    pages,
    pageSize,
    binding,
    panelOpen,
    PAGE_SIZES,
    BINDING_TYPES,
    addPages,
    removePage,
    toggleTrace,
    reorderPages,
    setPageSize,
    setBinding,
    togglePanel,
  } = useBooklet();

  const fileRef = useRef();
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const handleFiles = useCallback((files) => {
    const readers = Array.from(files).map(
      (file) =>
        new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then(addPages);
  }, [addPages]);

  const onFileInput = (e) => handleFiles(e.target.files);

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // Drag-to-reorder
  const dragStart = (i) => { dragItem.current = i; };
  const dragEnter = (i) => { dragOver.current = i; };
  const dragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    if (dragItem.current === dragOver.current) return;
    const copy = [...pages];
    const dragged = copy.splice(dragItem.current, 1)[0];
    copy.splice(dragOver.current, 0, dragged);
    reorderPages(copy);
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <div style={panelWrap(panelOpen)}>
      {/* Toggle tab */}
      <button style={toggleTab} onClick={togglePanel} title={panelOpen ? 'Collapse panel' : 'Expand panel'}>
        {panelOpen ? '◀' : '▶'}
      </button>

      {panelOpen && (
        <div style={panelInner}>
          <div style={sectionTitle}>BOOKLET SETTINGS</div>

          {/* Page size */}
          <div style={sectionLabel}>Page Size</div>
          <div style={buttonGroup}>
            {Object.keys(PAGE_SIZES).map((key) => (
              <button
                key={key}
                style={optBtn(pageSize === key)}
                onClick={() => setPageSize(key)}
              >
                {PAGE_SIZES[key].label}
              </button>
            ))}
          </div>

          {/* Binding */}
          <div style={sectionLabel}>Binding</div>
          <div style={buttonGroup}>
            {Object.keys(BINDING_TYPES).map((key) => (
              <button
                key={key}
                style={optBtn(binding === key)}
                onClick={() => setBinding(key)}
              >
                {BINDING_TYPES[key].label}
              </button>
            ))}
          </div>

          {/* Upload */}
          <div style={sectionTitle}>PAGES</div>
          <div
            style={dropZone}
            onClick={() => fileRef.current.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>+</div>
            <div style={{ fontSize: 11 }}>Drop images or click to upload</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={onFileInput}
          />

          {/* Page list */}
          <div style={pageList}>
            {pages.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', padding: '12px 0' }}>
                No pages yet
              </div>
            )}
            {pages.map((page, i) => (
              <div
                key={page.id}
                draggable
                onDragStart={() => dragStart(i)}
                onDragEnter={() => dragEnter(i)}
                onDragEnd={dragEnd}
                style={pageRow}
              >
                {/* Drag handle */}
                <span style={dragHandle}>⠿</span>

                {/* Thumbnail */}
                <div style={thumb}>
                  <img src={page.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {page.isTrace && (
                    <div style={traceBadge}>T</div>
                  )}
                </div>

                {/* Page number */}
                <div style={pageNum}>p{i + 1}</div>

                {/* Trace toggle */}
                <button
                  style={traceBtn(page.isTrace)}
                  onClick={() => toggleTrace(page.id)}
                  title={page.isTrace ? 'Set as standard' : 'Set as trace'}
                >
                  {page.isTrace ? 'Trace' : 'Std'}
                </button>

                {/* Remove */}
                <button
                  style={removeBtn}
                  onClick={() => removePage(page.id)}
                  title="Remove page"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const panelWrap = (open) => ({
  position: 'fixed',
  top: '50%',
  right: 0,
  transform: 'translateY(-50%)',
  width: open ? 240 : 0,
  maxHeight: '90vh',
  backgroundColor: 'rgba(18,20,24,0.92)',
  backdropFilter: 'blur(12px)',
  borderRadius: '12px 0 0 12px',
  boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'width 0.25s ease',
});

const toggleTab = {
  position: 'absolute',
  left: -36,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 36,
  height: 48,
  background: 'rgba(18,20,24,0.92)',
  border: 'none',
  borderRadius: '8px 0 0 8px',
  color: 'rgba(255,255,255,0.6)',
  fontSize: 12,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '-2px 0 12px rgba(0,0,0,0.3)',
};

const panelInner = {
  width: 240,
  padding: '20px 16px',
  overflowY: 'auto',
  overflowX: 'hidden',
  flex: 1,
  minWidth: 240,
};

const sectionTitle = {
  fontSize: 10,
  letterSpacing: '0.15em',
  color: 'rgba(255,255,255,0.4)',
  marginTop: 16,
  marginBottom: 8,
  fontFamily: 'sans-serif',
};

const sectionLabel = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.55)',
  marginTop: 12,
  marginBottom: 6,
  fontFamily: 'sans-serif',
};

const buttonGroup = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginBottom: 4,
};

const optBtn = (active) => ({
  padding: '5px 10px',
  fontSize: 11,
  fontFamily: 'sans-serif',
  border: active ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6,
  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

const dropZone = {
  border: '1px dashed rgba(255,255,255,0.2)',
  borderRadius: 8,
  padding: '14px 0',
  textAlign: 'center',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.45)',
  fontFamily: 'sans-serif',
  marginBottom: 12,
  transition: 'border-color 0.15s',
};

const pageList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  maxHeight: 320,
  overflowY: 'auto',
};

const pageRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 4px',
  borderRadius: 6,
  background: 'rgba(255,255,255,0.04)',
  cursor: 'grab',
};

const dragHandle = {
  color: 'rgba(255,255,255,0.25)',
  fontSize: 14,
  cursor: 'grab',
  flexShrink: 0,
};

const thumb = {
  width: 32,
  height: 40,
  borderRadius: 3,
  overflow: 'hidden',
  flexShrink: 0,
  background: 'rgba(255,255,255,0.08)',
  position: 'relative',
};

const traceBadge = {
  position: 'absolute',
  bottom: 0,
  right: 0,
  background: 'rgba(100,180,255,0.8)',
  color: '#fff',
  fontSize: 7,
  padding: '1px 2px',
  borderRadius: '2px 0 0 0',
  fontFamily: 'sans-serif',
  fontWeight: 'bold',
};

const pageNum = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.4)',
  fontFamily: 'monospace',
  flexShrink: 0,
  width: 20,
};

const traceBtn = (active) => ({
  fontSize: 9,
  padding: '3px 5px',
  borderRadius: 4,
  border: active ? '1px solid rgba(100,180,255,0.6)' : '1px solid rgba(255,255,255,0.12)',
  background: active ? 'rgba(100,180,255,0.2)' : 'transparent',
  color: active ? 'rgba(100,180,255,0.9)' : 'rgba(255,255,255,0.35)',
  cursor: 'pointer',
  fontFamily: 'sans-serif',
  flexShrink: 0,
});

const removeBtn = {
  marginLeft: 'auto',
  background: 'none',
  border: 'none',
  color: 'rgba(255,100,100,0.5)',
  fontSize: 16,
  cursor: 'pointer',
  lineHeight: 1,
  padding: '0 2px',
  flexShrink: 0,
};
