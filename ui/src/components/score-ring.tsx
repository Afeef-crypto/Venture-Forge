const R = 38;
const CIRCUMFERENCE = 2 * Math.PI * R;

const SIZE_CONFIG = {
  lg: { box: "h-28 w-28", score: "text-2xl", trackWidth: 6, progressWidth: 6 },
  sm: { box: "h-16 w-16", score: "text-lg", trackWidth: 6, progressWidth: 6 },
  md: { box: "h-12 w-12", score: "text-sm font-semibold", trackWidth: 4, progressWidth: 5 },
} as const;

export function ScoreRing({
  score = 87,
  size = "lg",
}: {
  score?: number;
  size?: keyof typeof SIZE_CONFIG;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const cfg = SIZE_CONFIG[size];
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className={`relative shrink-0 ${cfg.box}`} aria-label={`Score ${clamped} out of 100`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={cfg.trackWidth}
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={cfg.progressWidth}
          strokeLinecap="round"
          className="text-primary transition-all duration-700"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={`absolute inset-0 grid place-items-center font-display ${cfg.score}`}>{clamped}</span>
    </div>
  );
}
