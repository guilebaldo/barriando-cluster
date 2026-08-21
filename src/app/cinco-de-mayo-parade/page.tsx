import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  cincoDeMayoParadeCopy,
  parseParadeLang,
} from "../data/cinco-de-mayo-parade";
import CincoDeMayoParadeView from "./CincoDeMayoParadeView";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const lang = parseParadeLang(params.lang);
  const copy = cincoDeMayoParadeCopy[lang];
  const path =
    lang === "en" ? "/cinco-de-mayo-parade?lang=en" : "/cinco-de-mayo-parade";

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: path,
      languages: {
        "es-MX": "/cinco-de-mayo-parade",
        en: "/cinco-de-mayo-parade?lang=en",
      },
    },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      locale: lang === "en" ? "en_US" : "es_MX",
      type: "website",
    },
  };
}

export default function CincoDeMayoParadePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 min-h-[60vh] bg-[#27366D]" aria-hidden />
        }
      >
        <CincoDeMayoParadeView />
      </Suspense>
      <Footer />
    </div>
  );
}
