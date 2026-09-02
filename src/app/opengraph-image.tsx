import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'GetCracked — Master Data Structures, Algorithms & System Design';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#030713',
          backgroundImage: 'radial-gradient(circle at 50% 25%, #172554 0%, #030713 85%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Brand Logo & Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              backgroundColor: '#fdfd01',
              border: '3px solid #030713',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 36px rgba(253, 253, 1, 0.35)',
            }}
          >
            <span style={{ fontSize: '38px', fontWeight: 900, color: '#030713', letterSpacing: '-0.05em' }}>
              GC
            </span>
          </div>
          <span style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-0.04em' }}>
            Get<span style={{ color: '#fdfd01' }}>Cracked</span>
          </span>
        </div>

        {/* Main Headline */}
        <div
          style={{
            fontSize: '50px',
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            maxWidth: '1000px',
            color: '#f8fafc',
          }}
        >
          Master Technical Interviews with Interactive Step-by-Step Runtimes
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '22px',
            color: '#94a3b8',
            textAlign: 'center',
            lineHeight: 1.4,
            marginBottom: '44px',
            maxWidth: '820px',
          }}
        >
          Animated Data Structure Visualizer · Real-World System Design Labs · Multi-Language Sandbox · Company Curriculums
        </div>

        {/* Feature Badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            'TypeScript / Python / Go / Java',
            'Full Visualizer Animations',
            'Architecture Canvas',
            'Target FAANG Problems',
          ].map((pill) => (
            <div
              key={pill}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '9999px',
                padding: '10px 24px',
                fontSize: '17px',
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
