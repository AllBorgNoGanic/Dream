/**
 * Skeleton shimmer components for loading states.
 *
 * <SkeletonCard />       - matches DreamCard shape
 * <SkeletonStatCard />   - matches StatCard shape
 * <SkeletonLine />       - generic shimmer line
 */

const SHIMMER_ID = "ds-skeleton-shimmer";
if (typeof document !== "undefined" && !document.getElementById(SHIMMER_ID)) {
  const style = document.createElement("style");
  style.id = SHIMMER_ID;
  style.textContent = `
    @keyframes ds-shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
  `;
  document.head.appendChild(style);
}

const shimmerGradient = "linear-gradient(90deg, rgba(200,160,30,0.04) 0%, rgba(200,160,30,0.1) 40%, rgba(200,160,30,0.04) 80%)";

function ShimmerBox({ width, height, borderRadius = 6, style: extra = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: shimmerGradient,
        backgroundSize: "800px 100%",
        animation: "ds-shimmer 1.6s ease-in-out infinite",
        ...extra,
      }}
    />
  );
}

export function SkeletonCard({ delay = 0 }) {
  return (
    <div
      style={{
        background: "rgba(6,12,22,0.7)",
        border: "1px solid rgba(200,160,30,0.1)",
        borderRadius: 18,
        padding: 24,
        marginBottom: 16,
        animation: `fadeIn 0.4s ease ${delay}s both`,
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <ShimmerBox width="55%" height={18} borderRadius={8} />
        <ShimmerBox width={28} height={28} borderRadius={14} />
      </div>
      {/* Date / meta line */}
      <ShimmerBox width="40%" height={12} borderRadius={6} style={{ marginBottom: 14 }} />
      {/* Description lines */}
      <ShimmerBox width="100%" height={12} borderRadius={6} style={{ marginBottom: 8 }} />
      <ShimmerBox width="80%" height={12} borderRadius={6} />
    </div>
  );
}

export function SkeletonStatCard({ delay = 0 }) {
  return (
    <div
      style={{
        background: "rgba(6,12,22,0.7)",
        border: "1px solid rgba(200,160,30,0.1)",
        borderRadius: 18,
        padding: "18px 16px",
        animation: `fadeIn 0.4s ease ${delay}s both`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <ShimmerBox width={32} height={32} borderRadius={16} />
      <ShimmerBox width="60%" height={10} borderRadius={5} />
      <ShimmerBox width="40%" height={16} borderRadius={6} />
    </div>
  );
}

export function SkeletonLine({ width = "100%", height = 12, delay = 0 }) {
  return (
    <ShimmerBox
      width={width}
      height={height}
      borderRadius={6}
      style={{ animation: `fadeIn 0.3s ease ${delay}s both, ds-shimmer 1.6s ease-in-out infinite` }}
    />
  );
}
