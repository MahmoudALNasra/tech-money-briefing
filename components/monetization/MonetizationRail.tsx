import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";
import { SponsoredPlacement } from "@/components/monetization/SponsoredPlacement";
import type { SponsorPlacementContext } from "@/lib/sponsor-config";

type MonetizationRailProps = {
  context: SponsorPlacementContext;
  placementIndex: number;
  newsletterSource: string;
  newsletterTitle?: string;
  newsletterDescription?: string;
};

export function MonetizationRail({
  context,
  placementIndex,
  newsletterSource,
  newsletterTitle,
  newsletterDescription
}: MonetizationRailProps) {
  return (
    <div className="mt-12 space-y-6 border-t border-stone-200 pt-10">
      <NewsletterCapture
        placementIndex={placementIndex}
        source={newsletterSource}
        variant="compact"
        title={newsletterTitle}
        description={newsletterDescription}
      />
      <SponsoredPlacement context={context} placementIndex={placementIndex + 1} />
    </div>
  );
}
