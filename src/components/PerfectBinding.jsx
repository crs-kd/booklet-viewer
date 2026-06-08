import React from 'react';

/**
 * Perfect bound / Chicago screw: no visible hardware.
 * Pages meet at the centre gutter. The illusion of pages curving into
 * the spine is handled by the shadow gradients on each Page component.
 * This component adds only a hairline centre seam and a soft glow
 * to reinforce the glued spine edge.
 */
export default function PerfectBinding({ bookHeight }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 6,
        height: bookHeight,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      {/* Hairline seam at the exact centre */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1,
          height: '100%',
          background: 'rgba(0,0,0,0.35)',
        }}
      />
      {/* Soft ambient glow either side of the seam to suggest paper depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, rgba(0,0,0,0.12) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
        }}
      />
    </div>
  );
}
