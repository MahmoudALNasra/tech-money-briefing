import { permanentRedirect } from "next/navigation";

export default function BusinessLeadGeneratorRedirect() {
  permanentRedirect("/leads");
}
