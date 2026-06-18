import type {
  BrandedImageCallout,
  BrandedImageCalloutAccent,
  BrandedResultImageInput
} from "@/lib/branded-result-image/types";

const ACCENT_STYLES: Record<
  BrandedImageCalloutAccent,
  { background: string; border: string; text: string }
> = {
  danger: { background: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  warning: { background: "#fffbeb", border: "#fde68a", text: "#92400e" },
  success: { background: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  info: { background: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
  neutral: { background: "#f8fafc", border: "#e2e8f0", text: "#334155" }
};

type RenderTemplateProps = {
  input: BrandedResultImageInput;
  variant: "square" | "landscape";
  logoSrc: string;
};

function CalloutCard({
  callout,
  compact
}: {
  callout: BrandedImageCallout;
  compact: boolean;
}) {
  const style = ACCENT_STYLES[callout.accent];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 12,
        background: style.background,
        border: `2px solid ${style.border}`,
        borderRadius: 20,
        padding: compact ? "14px 16px" : "16px 18px",
        flex: 1,
        minWidth: compact ? 220 : 240
      }}
    >
      <div style={{ display: "flex", fontSize: compact ? 28 : 32 }}>{callout.emoji}</div>
      <div
        style={{
          display: "flex",
          fontSize: compact ? 18 : 20,
          fontWeight: 800,
          lineHeight: 1.25,
          color: style.text
        }}
      >
        {callout.text}
      </div>
    </div>
  );
}

export function createBrandedResultImageElement({
  input,
  variant,
  logoSrc
}: RenderTemplateProps) {
  const isLandscape = variant === "landscape";
  const padding = isLandscape ? 36 : 44;
  const hookSize = isLandscape ? 46 : 52;
  const punchSize = isLandscape ? 24 : 26;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "linear-gradient(145deg, #0f172a 0%, #1e293b 42%, #064e3b 100%)",
        padding,
        boxSizing: "border-box",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          background: "#ffffff",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 28px 80px rgba(0, 0, 0, 0.35)"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
            padding: isLandscape ? "22px 28px" : "26px 32px"
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: isLandscape ? 14 : 15,
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#78350f"
            }}
          >
            🔎 Real /leads scan
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: hookSize,
              fontWeight: 900,
              lineHeight: 1.08,
              color: "#0c0a09",
              maxWidth: isLandscape ? 980 : 920
            }}
          >
            {input.hook_question}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            padding: isLandscape ? "24px 28px 20px" : "28px 32px 24px"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              marginBottom: 18
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: isLandscape ? 16 : 17,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#64748b"
              }}
            >
              Signals we found
            </div>
            <div
              style={{
                display: "flex",
                background: "#ecfdf5",
                color: "#065f46",
                border: "2px solid #6ee7b7",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: isLandscape ? 16 : 17,
                fontWeight: 900
              }}
            >
              🎯 {input.badge_label}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 20
            }}
          >
            {input.callouts.map((callout) => (
              <CalloutCard key={`${callout.emoji}-${callout.text}`} callout={callout} compact={isLandscape} />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background: "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)",
              border: "3px solid #34d399",
              borderRadius: 22,
              padding: isLandscape ? "18px 22px" : "22px 24px",
              flex: 1
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: isLandscape ? 14 : 15,
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#047857"
              }}
            >
              The hook
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 10,
                fontSize: punchSize,
                fontWeight: 800,
                lineHeight: 1.35,
                color: "#064e3b"
              }}
            >
              {input.punch_line}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 18,
              paddingTop: 16,
              borderTop: "2px solid #e2e8f0"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={logoSrc} width={34} height={34} alt="" style={{ borderRadius: 8 }} />
              <div
                style={{
                  display: "flex",
                  fontSize: isLandscape ? 20 : 22,
                  fontWeight: 900,
                  color: "#0f766e"
                }}
              >
                techrevenuebrief.com/leads
              </div>
            </div>
            <div
              style={{
                display: "flex",
                background: "#0f172a",
                color: "#f8fafc",
                borderRadius: 999,
                padding: "10px 18px",
                fontSize: isLandscape ? 16 : 17,
                fontWeight: 900
              }}
            >
              Run your free scan →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
