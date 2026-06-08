import React from 'react';

/**
 * Renders a column of metallic rings at the spine.
 * Rings are rendered as SVG ovals with metallic gradient to imply cylindrical metal.
 */
export default function RingBinding({ bookHeight }) {
  const ringCount = Math.max(4, Math.floor(bookHeight / 40));
  const ringHeight = 18;
  const ringWidth = 28;
  const gap = (bookHeight - ringCount * ringHeight) / (ringCount + 1);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: ringWidth + 4,
        height: bookHeight,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <svg
        width={ringWidth + 4}
        height={bookHeight}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Metallic silver gradient */}
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8a8a8a" />
            <stop offset="20%" stopColor="#d4d4d4" />
            <stop offset="45%" stopColor="#f5f5f5" />
            <stop offset="60%" stopColor="#e0e0e0" />
            <stop offset="80%" stopColor="#b0b0b0" />
            <stop offset="100%" stopColor="#888" />
          </linearGradient>
          <linearGradient id="ringInner" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#555" />
            <stop offset="50%" stopColor="#aaa" />
            <stop offset="100%" stopColor="#444" />
          </linearGradient>
          <filter id="ringDrop" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.4)" />
          </filter>
        </defs>

        {Array.from({ length: ringCount }, (_, i) => {
          const cy = gap + i * (ringHeight + gap) + ringHeight / 2;
          const rx = ringWidth / 2;
          const ry = ringHeight / 2;

          return (
            <g key={i} filter="url(#ringDrop)">
              {/* Outer ring body */}
              <ellipse
                cx={rx + 2}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="url(#ringGrad)"
                stroke="#707070"
                strokeWidth="0.5"
              />
              {/* Inner cutout */}
              <ellipse
                cx={rx + 2}
                cy={cy}
                rx={rx - 5}
                ry={ry - 5}
                fill="url(#ringInner)"
              />
              {/* Highlight arc */}
              <ellipse
                cx={rx + 2}
                cy={cy - ry * 0.3}
                rx={rx * 0.55}
                ry={ry * 0.2}
                fill="rgba(255,255,255,0.6)"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
