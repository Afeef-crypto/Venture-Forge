import { motion } from "framer-motion";

/** viewBox matches paperplane-removebg-preview.png (707×353). */
const VB = { w: 707, h: 353 };

/** Rear tip — center of the trailing edge where the wake begins. */
const TAIL = { x: 416, y: 296 };

function PlaneEffectsBack() {
  return (
    <svg
      className="hero-plane-fx hero-plane-fx-back pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
    >
      <g className="hero-arc-group">
        <circle cx="340" cy="168" r="72" stroke="currentColor" strokeWidth="1.1" strokeDasharray="3 11" className="hero-arc hero-arc-a" />
        <circle cx="340" cy="168" r="102" stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 13" className="hero-arc hero-arc-b" />
        <circle cx="340" cy="168" r="132" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 16" className="hero-arc hero-arc-c" />
        <circle cx="340" cy="168" r="162" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 18" className="hero-arc hero-arc-d" />
      </g>

      {/* Wake trail — behind plane; only the exit path past the tail is visible */}
      <path
        d={`M ${TAIL.x} ${TAIL.y}
          C 430 310, 450 328, 472 346
          C 494 364, 524 380, 556 384
          C 588 388, 612 368, 606 342
          C 600 316, 572 310, 548 324
          C 588 348, 648 353, ${VB.w} ${VB.h}`}
        className="hero-trail-path"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="7 9"
      />

      <g className="hero-speed-group">
        <line x1={TAIL.x + 4} y1={TAIL.y + 4} x2={TAIL.x + 54} y2={TAIL.y + 38} className="hero-speed-line hero-speed-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1={TAIL.x + 8} y1={TAIL.y + 10} x2={TAIL.x + 62} y2={TAIL.y + 48} className="hero-speed-line hero-speed-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <line x1={TAIL.x + 12} y1={TAIL.y + 16} x2={TAIL.x + 68} y2={TAIL.y + 56} className="hero-speed-line hero-speed-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function PlaneEffectsFront() {
  return (
    <svg
      className="hero-plane-fx hero-plane-fx-front pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
    >
      <g className="hero-motion-group">
        <line x1={TAIL.x} y1={TAIL.y} x2={TAIL.x + 16} y2={TAIL.y + 14} className="hero-motion-tick hero-motion-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1={TAIL.x - 5} y1={TAIL.y - 3} x2={TAIL.x - 16} y2={TAIL.y + 6} className="hero-motion-tick hero-motion-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <line x1={TAIL.x + 6} y1={TAIL.y - 2} x2={TAIL.x + 18} y2={TAIL.y + 8} className="hero-motion-tick hero-motion-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <line x1="468" y1="268" x2="482" y2="278" className="hero-motion-tick hero-motion-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="488" y1="278" x2="504" y2="290" className="hero-motion-tick hero-motion-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="502" y1="288" x2="518" y2="300" className="hero-motion-tick hero-motion-6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function HeroPaperPlane() {
  return (
    <motion.div
      aria-hidden
      className="hero-plane relative mx-auto flex w-full max-w-xl items-center justify-center min-h-[320px] sm:max-w-2xl sm:min-h-[440px] lg:max-w-3xl lg:min-h-[600px]"
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35, duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        className="hero-plane-float relative"
        animate={{
          y: [-18, -32, -18],
          x: [0, 8, 0],
          rotate: [-1.5, 2.5, -1.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 5.5,
          ease: "easeInOut",
        }}
      >
        <div className="hero-plane-scene">
          <div className="hero-plane-glow" />
          <PlaneEffectsBack />
          <img src="/paperplane-removebg-preview.png" alt="" className="hero-plane-image" draggable={false} />
          <PlaneEffectsFront />
        </div>
      </motion.div>
    </motion.div>
  );
}
