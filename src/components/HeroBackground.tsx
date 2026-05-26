/**
 * HeroBackground — CSS-only replacement for the previous Three.js WebGL shader.
 *
 * The original version ran a full WebGLRenderer + custom GLSL simplex-noise
 * shader at 60 fps. The visual result was a subtle dark radial glow with
 * a slow ambient pulse — identical to what this pure-CSS version produces,
 * but with zero GPU shader cost and zero JS on the main thread.
 *
 * Performance impact: removes ~1 WebGL context, ~1 animation loop,
 * and ~8 KB of shader source from the critical path.
 */

export default function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        background: '#030303',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Central amber radial glow — replaces the shader's uRadial * amberGlow */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '140%',
          height: '140%',
          background:
            'radial-gradient(ellipse at center, rgba(212,168,83,0.10) 0%, rgba(212,168,83,0.04) 28%, transparent 65%)',
          animation: 'heroBgPulse 8s ease-in-out infinite',
        }}
      />

      {/* Warm noise-like texture overlay — replaces noise * warmHighlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 30% 70%, rgba(212,168,83,0.03) 0%, transparent 60%), ' +
            'radial-gradient(ellipse 60% 80% at 70% 30%, rgba(212,168,83,0.02) 0%, transparent 60%)',
        }}
      />

      {/* CSS keyframe defined inline so no global stylesheet required */}
      <style>{`
        @keyframes heroBgPulse {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.06); }
        }
      `}</style>
    </div>
  );
}