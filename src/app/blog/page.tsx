import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { prisma } from "@/lib/prisma";
import { Calendar, User, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />

      <header className="bg-[#27366D] text-white py-16 px-6 text-center border-b border-[#1e2b58]">
        <div className="max-w-4xl mx-auto">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            Bitácora Cultural y Empresarial
          </span>
          <h1 className="text-3xl md:text-4xl font-black mt-3 mb-4">Blog del Clúster</h1>
          <p className="text-slate-200 text-sm max-w-2xl mx-auto font-light leading-relaxed">
            Noticias, proyectos, alianzas y reflexiones sobre el desarrollo turístico y económico de Puebla.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6 min-h-[50vh]">
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow transition flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-4 text-[11px] text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {post.fecha}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> Por: {post.autor}
                  </span>
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="font-bold text-slate-950 text-base mb-2 hover:text-[#27366D] transition">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#27366D] hover:gap-2 transition-all"
              >
                Leer artículo completo <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
