import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Tag, ArrowRight, Loader2 } from "lucide-react";

async function PostsGrid() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, summary, tags, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="col-span-full text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
        <p className="text-slate-400">No published posts found yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <article
          key={post.id}
          className="flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition duration-200 group"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <time dateTime={post.created_at}>
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>

            <h2 className="text-xl font-semibold text-slate-100 group-hover:text-indigo-400 transition">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>

            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
              {post.summary || "Click below to read the full article."}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {post.tags?.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700/50"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300"
            >
              Read <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function PostsFallback() {
  return (
    <div className="flex justify-center items-center py-20 text-slate-400 gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
      <span>Loading articles...</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="text-center space-y-4 border-b border-slate-800 pb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI-Augmented Developer Blog
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
            Insights on full-stack web development, AI integration, and modern
            cloud deployment.
          </p>
        </header>

        <section>
          <Suspense fallback={<PostsFallback />}>
            <PostsGrid />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
