import { SponsoredPlacement } from "@/components/monetization/SponsoredPlacement";

type PromotedPartnerCardProps = {
  placementIndex: number;
};

export function PromotedPartnerCard({ placementIndex }: PromotedPartnerCardProps) {
  return <SponsoredPlacement context="feed" placementIndex={placementIndex} />;
}
