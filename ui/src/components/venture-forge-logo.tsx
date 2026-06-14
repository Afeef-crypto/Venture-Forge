import { cn } from "@/lib/utils";

/** Brand orange — #FF6B00 range from identity guidelines */
export const VENTURE_FORGE_ORANGE = "#FF6B00";

const CENTER = 20;
const ORBIT = 11.5;
const OUTER_NODE_R = 2.15;
const CENTER_NODE_R = 2.65;

function councilNodes() {
  return Array.from({ length: 5 }, (_, index) => {
    const angle = (-90 + index * 72) * (Math.PI / 180);
    return {
      x: CENTER + ORBIT * Math.cos(angle),
      y: CENTER + ORBIT * Math.sin(angle),
    };
  });
}

type VentureForgeLogoProps = {
  size?: number;
  className?: string;
  /** Full orange disc + council mark, or geometry only for icon slots */
  variant?: "full" | "mark";
  title?: string;
};

export function VentureForgeLogo({
  size = 28,
  className,
  variant = "full",
  title = "Venture Forge",
}: VentureForgeLogoProps) {
  const nodes = councilNodes();
  const mark = variant === "full" ? "#FFFFFF" : "currentColor";
  const decorative = title === "";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {variant === "full" && <circle cx={CENTER} cy={CENTER} r={20} fill={VENTURE_FORGE_ORANGE} />}
      {nodes.map((node, index) => (
        <line
          key={`spoke-${index}`}
          x1={CENTER}
          y1={CENTER}
          x2={node.x}
          y2={node.y}
          stroke={mark}
          strokeWidth={1.35}
          strokeLinecap="round"
          opacity={variant === "full" ? 0.92 : 1}
        />
      ))}
      {nodes.map((node, index) => (
        <circle key={`node-${index}`} cx={node.x} cy={node.y} r={OUTER_NODE_R} fill={mark} />
      ))}
      <circle cx={CENTER} cy={CENTER} r={CENTER_NODE_R} fill={mark} />
    </svg>
  );
}
