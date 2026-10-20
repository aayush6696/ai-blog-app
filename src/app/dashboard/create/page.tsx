"use client";

import { useState } from "react";
import {
  generateBlogMetadata,
  GeneratedBlogMetadata,
} from "@/app/actions/blog";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Loader2, Save } from "lucide-react";

export default function CreatePostPage() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Trigger Gemini AI Metadata Generation
  async function handleAiGenerate() {
    if (!content || content.trim().length < 20) {
      setMessage({
        type: "error",
        text: "Please write at least 20 characters of content before generating metadata.",
      });
      return;
    }

    setIsAiLoading(true);
    setMessage(null);

    try {
      const data: GeneratedBlogMetadata = await generateBlogMetadata(content);
      setTitle(data.suggestedTitle);
      setSlug(data.slug);
      setMetaDescription(data.metaDescription);
      setSummary(data.summary);
      setTags(data.tags.join(", "));
      setMessage({
        type: "success",
        text: "AI successfully generated title, metadata, summary, and tags!",
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate metadata with AI.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsAiLoading(false);
    }
  }

  // Save Post to Supabase
  async function handleSavePost(publishedStatus: boolean) {
    if (!title || !slug || !content) {
      setMessage({
        type: "error",
        text: "Title, Slug, and Content are required.",
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Check for authenticated user first
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let authorId = user?.id;

      // Local Dev Fallback: If not logged in, fetch an existing profile ID from the profiles table
      if (!authorId) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .limit(1);
        if (profiles && profiles.length > 0) {
          authorId = profiles[0].id;
        }
      }

      if (!authorId) {
        setMessage({
          type: "error",
          text: "No author ID found. Please create a user in Supabase Auth or insert a record into public.profiles.",
        });
        setIsSaving(false);
        return;
      }

      const formattedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const { error } = await supabase.from("posts").insert([
        {
          author_id: authorId,
          title,
          slug,
          content,
          summary,
          meta_description: metaDescription,
          tags: formattedTags,
          published: publishedStatus,
        },
      ]);

      if (error) {
        setMessage({
          type: "error",
          text: `Error saving post: ${error.message}`,
        });
      } else {
        setMessage({
          type: "success",
          text: publishedStatus
            ? "Post published successfully!"
            : "Draft saved successfully!",
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred while saving.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 text-slate-100 min-h-screen rounded-lg shadow-xl my-8 border border-slate-800">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Create New Post</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSavePost(false)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium text-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSavePost(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium text-sm transition disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Publish
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md text-sm ${
            message.type === "success"
              ? "bg-emerald-950/80 border border-emerald-800 text-emerald-200"
              : "bg-rose-950/80 border border-rose-800 text-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Article Content (Markdown supported)
            </label>
            <textarea
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog post here..."
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={isAiLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-950/50 disabled:opacity-50"
          >
            {isAiLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Analyzing with
                Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Auto-Generate SEO & Metadata
                with Gemini AI
              </>
            )}
          </button>
        </div>

        {/* AI Output / Metadata Sidebar */}
        <div className="space-y-4 bg-slate-950 p-5 rounded-lg border border-slate-800">
          <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-2">
            SEO & Metadata Settings
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post Title"
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-post-slug"
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Meta Description
            </label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Search engine summary..."
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Executive Summary
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short reader summary..."
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="react, nextjs, ai"
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
