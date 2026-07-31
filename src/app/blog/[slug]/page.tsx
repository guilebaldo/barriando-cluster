import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { prisma } from "@/lib/prisma";
import { renderBlogMarkdown } from "@/lib/blog-content";
import { Calendar, User, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug, published: true } });
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />

      <header className="bg-[#27366D] text-white py-12 px-6 border-b border-[#1e2b58]">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mb-4 uppercase tracking-wider font-bold"
          >
            <ArrowLeft className="w-3 h-3" /> Volver al blog
          </Link>
          <h1 className="text-2xl md:text-3xl font-black font-serif-cluster uppercase tracking-wide leading-tight">
            {post.title}
          </h1>
          <div className="flex gap-4 text-[11px] text-slate-300 mt-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {post.fecha}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {post.autor}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-6">
        <article className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <p className="text-base text-slate-700 font-medium mb-6 border-b border-slate-100 pb-6">
            {post.excerpt}
          </p>
          {renderBlogMarkdown(post.content)}
        </article>
      </main>

      <Footer />
    </div>
  );
}
