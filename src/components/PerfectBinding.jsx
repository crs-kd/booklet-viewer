import React from 'react';

/**
 * Renders a flat perfect-bound spine strip at the centre.
 * Includes glue shadow on both sides.
 */
export default function PerfectBinding({ bookHeight }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 10,
        height: bookHeight,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      {/* Spine strip */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, #c8c0b8, #e8e4de, #c8c0b8)',
          boxShadow: '-4px 0 8px rgba(0,0,0,0.18), 4px 0 8px rgba(0,0,0,0.18)',
        }}
      />
    </div>
  );
}
