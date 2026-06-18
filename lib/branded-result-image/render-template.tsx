import type { BrandedResultImageInput } from "@/lib/branded-result-image/types";

const COLORS = {
  cardBg: "#ecfdf5",
  cardBorder: "#a7f3d0",
  ink: "#0c0a09",
  stone700: "#44403c",
  stone600: "#57534e",
  stone500: "#78716c",
  emerald700: "#047857",
  emerald800: "#065f46",
  white: "#ffffff"
} as const;

type RenderTemplateProps = {
  input: BrandedResultImageInput;
  variant: "square" | "landscape";
  logoSrc: string;
};

function metaChips(input: BrandedResultImageInput) {
  const chips: string[] = [];

  if (typeof input.competitor_density_1mi === "number") {
    chips.push(`${input.competitor_density_1mi} similar businesses within 1 mi`);
  }

  if (input.website_reachable === false) {
    chips.push("No reachable website");
  } else if (input.website_reachable === true) {
    chips.push("Website reachable");
  }

  if (input.active_social) {
    chips.push("Active social links found");
  }

  if (input.gbp_profile_signal) {
    chips.push(input.gbp_profile_signal);
  }

  return chips.slice(0, 3);
}

export function createBrandedResultImageElement({
  input,
  variant,
  logoSrc
}: RenderTemplateProps) {
  const isLandscape = variant === "landscape";
  const padding = isLandscape ? 48 : 56;
  const chips = metaChips(input);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #f8fafc 0%, #ecfdf5 100%)",
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
          background: COLORS.cardBg,
          border: `3px solid ${COLORS.cardBorder}`,
          borderRadius: 32,
          padding: isLandscape ? 40 : 44,
          position: "relative",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                fontSize: isLandscape ? 18 : 20,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: COLORS.emerald700
              }}
            >
              Fully analyzed
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: isLandscape ? 42 : 48,
                fontWeight: 900,
                lineHeight: 1.1,
                color: COLORS.ink,
                maxWidth: isLandscape ? 760 : 900
              }}
            >
              {input.headline}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: COLORS.white,
              color: COLORS.emerald800,
              border: `2px solid ${COLORS.cardBorder}`,
              borderRadius: 999,
              padding: "12px 20px",
              fontSize: isLandscape ? 18 : 20,
              fontWeight: 900,
              maxWidth: isLandscape ? 280 : 320,
              textAlign: "center"
            }}
          >
            {input.pitch_angle}
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: isLandscape ? 24 : 26,
            fontWeight: 700,
            lineHeight: 1.35,
            color: COLORS.stone700
          }}
        >
          {input.opportunity_signal}
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: isLandscape ? 22 : 24,
            lineHeight: 1.5,
            color: COLORS.stone600,
            flex: 1
          }}
        >
          {input.summary_line}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
          {chips.map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                background: COLORS.white,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 999,
                padding: "10px 16px",
                fontSize: isLandscape ? 16 : 18,
                fontWeight: 600,
                color: COLORS.stone600
              }}
            >
              {chip}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 28,
            paddingTop: 20,
            borderTop: `1px solid ${COLORS.cardBorder}`
          }}
        >
          <img
            src={logoSrc}
            width={32}
            height={32}
            alt=""
            style={{ borderRadius: 8 }}
          />
          <div
            style={{
              fontSize: isLandscape ? 20 : 22,
              fontWeight: 800,
              color: COLORS.emerald800,
              letterSpacing: "0.02em"
            }}
          >
            techrevenuebrief.com/leads
          </div>
        </div>
      </div>
    </div>
  );
}
