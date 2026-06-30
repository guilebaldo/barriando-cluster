import SociosPageClient from "./SociosPageClient";
import { getPublicSociosList } from "@/lib/public-socios";

export default async function SociosPage() {
  const socios = await getPublicSociosList();
  return <SociosPageClient socios={socios} />;
}
