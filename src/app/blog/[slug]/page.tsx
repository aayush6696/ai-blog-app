import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { Calendar, Tag, ArrowLeft, Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate Dynamic SEO Metadata
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  "use cache";

  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, meta_description, summary")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | Developer Blog`,
    description: post.meta_description || post.summary || undefined,
  };
}

async function PostContent({ params }: PageProps) {
  "use cache";

  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select("*, profiles(full_name, avatar_url)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !post) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all articles
        </Link>

        {/* Article Header */}
        <header className="space-y-4 border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {post.profiles?.full_name && (
              <span>• By {post.profiles.full_name}</span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            {post.title}
          </h1>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/40"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Article Summary Box */}
        {post.summary && (
          <div className="p-4 bg-slate-900 border-l-4 border-indigo-500 rounded-r-lg text-slate-300 text-sm leading-relaxed">
            <strong className="text-indigo-400 block mb-1 font-semibold">
              Executive Summary:
            </strong>
            {post.summary}
          </div>
        )}

        {/* Post Content */}
        <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed font-sans text-base whitespace-pre-wrap">
          {post.content}
        </div>
      </div>
    </article>
  );
}

function ArticleFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
      <span className="text-slate-400 text-sm">Loading article...</span>
    </div>
  );
}

export default function BlogPostPage(props: PageProps) {
  return (
    <Suspense fallback={<ArticleFallback />}>
      <PostContent {...props} />
    </Suspense>
  );
}
