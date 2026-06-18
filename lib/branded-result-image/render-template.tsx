import type {
  BrandedImageCallout,
  BrandedImageCalloutAccent,
  BrandedResultImageInput
} from "@/lib/branded-result-image/types";
import { getBrandedImageTheme, type BrandedImageThemeId } from "@/lib/branded-result-image/themes";

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

const NEON_CALLOUT_STYLES: Record<
  BrandedImageCalloutAccent,
  { background: string; border: string; text: string }
> = {
  danger: { background: "#450a0a", border: "#f87171", text: "#fecaca" },
  warning: { background: "#422006", border: "#fbbf24", text: "#fde68a" },
  success: { background: "#052e16", border: "#4ade80", text: "#bbf7d0" },
  info: { background: "#172554", border: "#60a5fa", text: "#bfdbfe" },
  neutral: { background: "#1e293b", border: "#64748b", text: "#e2e8f0" }
};

type RenderTemplateProps = {
  input: BrandedResultImageInput;
  variant: "square" | "landscape";
  logoSrc: string;
};

function calloutStyles(themeId: BrandedImageThemeId, accent: BrandedImageCalloutAccent) {
  if (themeId === "neon-midnight") {
    return NEON_CALLOUT_STYLES[accent];
  }

  return ACCENT_STYLES[accent];
}

function CalloutCard({
  callout,
  compact,
  themeId
}: {
  callout: BrandedImageCallout;
  compact: boolean;
  themeId: BrandedImageThemeId;
}) {
  const style = calloutStyles(themeId, callout.accent);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 12,
        background: style.background,
        border: `2px solid ${style.border}`,
        borderRadius: themeId === "coral-burst" ? 16 : 20,
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
  const theme = getBrandedImageTheme(input.themeId);
  const isLandscape = variant === "landscape";
  const padding = isLandscape ? 36 : 44;
  const hookSize = isLandscape ? 46 : 52;
  const punchSize = isLandscape ? 24 : 26;
  const cardBackground = theme.id === "neon-midnight" ? "#0f172a" : "#ffffff";
  const bodyTextOnDark = theme.id === "neon-midnight";

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: theme.outerBackground,
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
          background: cardBackground,
          borderRadius: theme.id === "coral-burst" ? 24 : 28,
          overflow: "hidden",
          boxShadow: theme.cardShadow,
          border: theme.id === "neon-midnight" ? "2px solid #4c1d95" : undefined
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: theme.hookBackground,
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
              color: theme.hookEyebrowColor
            }}
          >
            {theme.eyebrowLabel}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontSize: isLandscape ? 18 : 20,
              fontWeight: 800,
              color: theme.hookEyebrowColor
            }}
          >
            🏷️ {input.business_category_label} · 📍 {input.area_label}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: hookSize,
              fontWeight: 900,
              lineHeight: 1.08,
              color: theme.hookTextColor,
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
                color: bodyTextOnDark ? "#94a3b8" : theme.sectionLabelColor
              }}
            >
              Signals we found
            </div>
            <div
              style={{
                display: "flex",
                background: theme.badgeBackground,
                color: theme.badgeColor,
                border: `2px solid ${theme.badgeBorder}`,
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
              <CalloutCard
                key={`${callout.emoji}-${callout.text}`}
                callout={callout}
                compact={isLandscape}
                themeId={theme.id}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background: theme.punchBackground,
              border: `3px solid ${theme.punchBorder}`,
              borderRadius: theme.id === "ocean-signal" ? 18 : 22,
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
                color: theme.punchLabelColor
              }}
            >
              {theme.punchLabel}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 10,
                fontSize: punchSize,
                fontWeight: 800,
                lineHeight: 1.35,
                color: theme.punchTextColor
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
              borderTop: `2px solid ${theme.footerBorder}`
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={logoSrc} width={34} height={34} alt="" style={{ borderRadius: 8 }} />
              <div
                style={{
                  display: "flex",
                  fontSize: isLandscape ? 20 : 22,
                  fontWeight: 900,
                  color: theme.siteUrlColor
                }}
              >
                techrevenuebrief.com/leads
              </div>
            </div>
            <div
              style={{
                display: "flex",
                background: theme.ctaBackground,
                color: theme.ctaColor,
                borderRadius: 999,
                padding: "10px 18px",
                fontSize: isLandscape ? 16 : 17,
                fontWeight: 900
              }}
            >
              {theme.ctaText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
