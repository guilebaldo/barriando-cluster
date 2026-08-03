import { loadSellarPage } from "../load-sellar-page";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SellarSlugPage({ params }: Props) {
  const { slug } = await params;
  return loadSellarPage(slug);
}
