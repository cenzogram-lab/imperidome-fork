import { Image, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../../backend.d";
import type { BlogPost } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function formatDate(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminBlogPage() {
  const { actor, isFetching } = useActor();
  const { session } = useSession();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"list" | "editor">("list");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [category, setCategory] = useState("Tips");
  const [author, setAuthor] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [featuredImageCaption, setFeaturedImageCaption] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [seoMetaDescription, setSeoMetaDescription] = useState("");
  const [seoMetaKeywords, setSeoMetaKeywords] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorBody, setEditorBody] = useState<string>("");

  const fetchPosts = useCallback(() => {
    if (!actor) return;
    setLoading(true);
    actor
      .getAllBlogPostsAdmin()
      .then((data) => {
        const sorted = [...data].sort((a, b) =>
          b.created_at > a.created_at
            ? 1
            : b.created_at < a.created_at
              ? -1
              : 0,
        );
        setPosts(sorted);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    fetchPosts();
  }, [actor, isFetching, fetchPosts]);

  useEffect(() => {
    if (session && !editingPost) setAuthor(session.firstName || "");
  }, [session, editingPost]);

  useEffect(() => {
    if (!slugManual) setSlug(slugify(title));
  }, [title, slugManual]);

  function openNewEditor() {
    setEditingPost(null);
    setTitle("");
    setSlug("");
    setSlugManual(false);
    setCategory("Tips");
    setAuthor(session?.firstName || "");
    setExcerpt("");
    setFeaturedImageUrl(null);
    setFeaturedImageCaption("");
    setStatus("draft");
    setSeoMetaDescription("");
    setSeoMetaKeywords("");
    setSaveError("");
    setSaveSuccess(false);
    setEditorBody("");
    setView("editor");
  }

  function openEditEditor(post: BlogPost) {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setSlugManual(true);
    setCategory(post.category);
    setAuthor(post.author);
    setExcerpt(post.excerpt);
    setFeaturedImageUrl(post.featured_image_url ?? null);
    setFeaturedImageCaption(post.featuredImageCaption ?? "");
    setStatus(post.status as "draft" | "published");
    setSeoMetaDescription(post.seoMetaDescription ?? "");
    setSeoMetaKeywords(post.seoMetaKeywords ?? "");
    setSaveError("");
    setSaveSuccess(false);
    setEditorBody(post.body);
    setView("editor");
  }

  function backToList() {
    setView("list");
    setEditingPost(null);
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setImageUploadError(null);
    try {
      const icpBlobStorage = (
        window as Window & {
          __icpBlobStorage?: {
            ExternalBlob: {
              fromBytes: (bytes: Uint8Array) => { getDirectURL: () => string };
            };
          };
        }
      ).__icpBlobStorage;
      if (!icpBlobStorage) {
        setImageUploadError("Image upload not available in this environment");
        return;
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const externalBlob = icpBlobStorage.ExternalBlob.fromBytes(bytes);
      const url = externalBlob.getDirectURL();
      setFeaturedImageUrl(url);
    } catch (err) {
      setImageUploadError(
        err instanceof Error
          ? err.message
          : "Image upload failed — please try again",
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    if (!actor) return;
    setSaveError("");
    if (!title.trim()) {
      setSaveError("Title is required.");
      return;
    }
    if (!slug.trim()) {
      setSaveError("Slug is required.");
      return;
    }
    if (excerpt.length > 160) {
      setSaveError("Excerpt must be 160 characters or fewer.");
      return;
    }
    const body = editorBody;
    setSaving(true);
    try {
      let result: unknown;
      if (editingPost) {
        result = await (actor as backendInterface).updateBlogPost(
          editingPost.id,
          title.trim(),
          slug.trim(),
          category,
          excerpt,
          body,
          author,
          featuredImageUrl,
          featuredImageCaption,
          status,
          seoMetaDescription.trim() ? seoMetaDescription.trim() : null,
          seoMetaKeywords.trim() ? seoMetaKeywords.trim() : null,
        );
      } else {
        result = await (actor as backendInterface).createBlogPost(
          title.trim(),
          slug.trim(),
          category,
          excerpt,
          body,
          author,
          featuredImageUrl,
          featuredImageCaption,
          status,
          seoMetaDescription.trim() ? seoMetaDescription.trim() : null,
          seoMetaKeywords.trim() ? seoMetaKeywords.trim() : null,
        );
      }
      if (result && typeof result === "object" && "err" in result) {
        const errMsg =
          (result as { err: string }).err || "Failed to save post.";
        toast.error(errMsg);
        return;
      }
      setSaveSuccess(true);
      fetchPosts();
      setTimeout(() => {
        setSaveSuccess(false);
        backToList();
      }, 1200);
    } catch (err) {
      const detail = err instanceof Error ? err.message : null;
      setSaveError("Save Failed \u2014 please try again");
      setSaveErrorDetail(detail);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setSaveError("");
        setSaveErrorDetail(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(post: BlogPost) {
    if (!actor) return;
    // Snapshot current posts for rollback on failure
    const previousPosts = posts;
    // Optimistic update — flip the status immediately
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, status: p.status === "published" ? "draft" : "published" }
          : p,
      ),
    );
    try {
      if (post.status === "published") {
        await (actor as backendInterface).unpublishBlogPost(post.id);
      } else {
        await (actor as backendInterface).publishBlogPost(post.id);
      }
      fetchPosts();
    } catch {
      // Revert the optimistic update
      setPosts(previousPosts);
      // Show error banner (same style as deleteError)
      setDeleteError(
        post.status === "published"
          ? "Failed to unpublish post — please try again."
          : "Failed to publish post — please try again.",
      );
      setTimeout(() => setDeleteError(null), 5000);
    }
  }

  async function handleDelete(id: bigint) {
    if (!actor) return;
    setDeleteError(null);
    try {
      await (actor as backendInterface).deleteBlogPost(id);
      setDeleteConfirmId(null);
      fetchPosts();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Delete failed — please try again.";
      setDeleteError(msg);
      setDeleteConfirmId(null);
    }
  }

  const DARK_CARD: CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid #1C1F33",
    borderRadius: "8px",
    padding: "24px",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(94,240,138,0.3)",
    fontSize: "14px",
    color: "#EEF0F8",
    background: "rgba(0,0,0,0.6)",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "'Courier New', monospace",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#5EF08A",
    fontFamily: "'Courier New', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "6px",
  };

  // ──── LIST VIEW ────
  if (view === "list") {
    return (
      <AdminLayout pageTitle="Blog">
        <style>
          {"@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }"}
        </style>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {deleteError && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "6px",
                padding: "12px 16px",
                color: "#f87171",
                fontSize: "13px",
              }}
            >
              {deleteError}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "#EEF0F8",
              }}
            >
              <TypewriterText className="matrix-heading" text="Blog Posts" />
            </h2>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <a
                href="/blog"
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="admin.blog.view_public.button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "#39FF14",
                  border: "1px solid rgba(57,255,20,0.4)",
                  background: "rgba(57,255,20,0.06)",
                  borderRadius: "7px",
                  padding: "9px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
              >
                View Public Blog ↗
              </a>
              <button
                type="button"
                data-ocid="admin.blog.new_post.button"
                onClick={openNewEditor}
                style={{
                  background: "#5EF08A",
                  color: "#061209",
                  border: "none",
                  borderRadius: "7px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + New Post
              </button>
            </div>
          </div>

          <div style={DARK_CARD}>
            {loading ? (
              <div
                data-ocid="admin.blog.posts.loading_state"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: "48px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "6px",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ) : loadError ? (
              <p
                data-ocid="admin.blog.posts.error_state"
                style={{ color: "#f87171", fontSize: "14px", margin: 0 }}
              >
                Could not load posts. Please refresh.
              </p>
            ) : posts.length === 0 ? (
              <p
                data-ocid="admin.blog.posts.empty_state"
                style={{ color: "#7A7D90", fontSize: "14px", margin: 0 }}
              >
                No posts yet. Create your first post.
              </p>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                  WebkitOverflowScrolling:
                    "touch" as CSSProperties["WebkitOverflowScrolling"],
                }}
              >
                <table
                  data-ocid="admin.blog.posts.table"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "600px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                      {[
                        "Title",
                        "Category",
                        "Status",
                        "Published Date",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#7A7D90",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post, idx) => (
                      <tr
                        key={String(post.id)}
                        data-ocid={`admin.blog.posts.row.${idx + 1}`}
                        style={{ borderBottom: "1px solid #1C1F33" }}
                      >
                        <td
                          style={{
                            padding: "12px 14px",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#EEF0F8",
                            maxWidth: "260px",
                          }}
                        >
                          {post.title}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            fontSize: "13px",
                            color: "#7A7D90",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {post.category}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background:
                                post.status === "published"
                                  ? "rgba(94,240,138,0.15)"
                                  : "rgba(122,125,144,0.15)",
                              color:
                                post.status === "published"
                                  ? "#5EF08A"
                                  : "#7A7D90",
                            }}
                          >
                            {post.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            fontSize: "13px",
                            color: "#7A7D90",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {post.published_at
                            ? formatDate(post.published_at)
                            : "\u2014"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              title="Edit post"
                              data-ocid={`admin.blog.posts.edit_button.${idx + 1}`}
                              onClick={() => openEditEditor(post)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#5EF08A",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              data-ocid={`admin.blog.posts.toggle.${idx + 1}`}
                              onClick={() => handleTogglePublish(post)}
                              style={{
                                border: "1px solid",
                                borderRadius: "5px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                background:
                                  post.status === "published"
                                    ? "rgba(122,125,144,0.15)"
                                    : "rgba(94,240,138,0.15)",
                                color:
                                  post.status === "published"
                                    ? "#7A7D90"
                                    : "#5EF08A",
                                borderColor:
                                  post.status === "published"
                                    ? "rgba(122,125,144,0.3)"
                                    : "rgba(94,240,138,0.3)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {post.status === "published"
                                ? "Unpublish"
                                : "Publish"}
                            </button>

                            {deleteConfirmId === post.id ? (
                              <>
                                <span
                                  style={{ fontSize: "12px", color: "#f87171" }}
                                >
                                  Delete?
                                </span>
                                <button
                                  type="button"
                                  data-ocid={`admin.blog.posts.confirm_button.${idx + 1}`}
                                  onClick={() => handleDelete(post.id)}
                                  style={{
                                    background: "rgba(239,68,68,0.2)",
                                    color: "#f87171",
                                    border: "1px solid rgba(239,68,68,0.3)",
                                    borderRadius: "5px",
                                    padding: "4px 8px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  data-ocid={`admin.blog.posts.cancel_button.${idx + 1}`}
                                  onClick={() => setDeleteConfirmId(null)}
                                  style={{
                                    background: "none",
                                    border: "1px solid #1C1F33",
                                    borderRadius: "5px",
                                    padding: "4px 8px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    color: "#7A7D90",
                                  }}
                                >
                                  No
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                title="Delete post"
                                data-ocid={`admin.blog.posts.delete_button.${idx + 1}`}
                                onClick={() => setDeleteConfirmId(post.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#f87171",
                                  padding: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ──── EDITOR VIEW ────
  return (
    <AdminLayout pageTitle={editingPost ? "Edit Post" : "New Post"}>
      <div
        data-ocid="admin.blog.editor.panel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "800px",
        }}
      >
        <button
          type="button"
          data-ocid="admin.blog.cancel.button"
          onClick={backToList}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#5EF08A",
            fontSize: "14px",
            fontWeight: 600,
            padding: 0,
            alignSelf: "flex-start",
          }}
        >
          \u2190 Back to Posts
        </button>

        {saveError && (
          <div
            data-ocid="admin.blog.save.error_state"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "6px",
              padding: "12px 16px",
              color: "#f87171",
              fontSize: "13px",
            }}
          >
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div
            data-ocid="admin.blog.save.success_state"
            style={{
              background: "rgba(94,240,138,0.08)",
              border: "1px solid rgba(94,240,138,0.2)",
              borderRadius: "6px",
              padding: "12px 16px",
              color: "#5EF08A",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Post saved successfully!
          </div>
        )}

        <div>
          <label htmlFor="blog-title" style={labelStyle}>
            Title
          </label>
          <input
            id="blog-title"
            type="text"
            data-ocid="admin.blog.title.input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            style={{
              ...inputStyle,
              fontSize: "20px",
              fontWeight: 700,
              padding: "12px 14px",
            }}
          />
        </div>

        <div>
          <label htmlFor="blog-slug" style={labelStyle}>
            Slug
          </label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                padding: "10px 10px 10px 12px",
                background: "rgba(19,21,36,0.8)",
                border: "1px solid #1C1F33",
                borderRight: "none",
                borderRadius: "6px 0 0 6px",
                fontSize: "13px",
                color: "#7A7D90",
                whiteSpace: "nowrap",
              }}
            >
              /blog/
            </span>
            <input
              id="blog-slug"
              type="text"
              data-ocid="admin.blog.slug.input"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManual(true);
              }}
              style={{ ...inputStyle, borderRadius: "0 6px 6px 0", flex: 1 }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <label htmlFor="blog-category" style={labelStyle}>
              Category
            </label>
            <select
              id="blog-category"
              data-ocid="admin.blog.category.select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              {[
                "All",
                ...[
                  ...new Set(posts.map((p) => p.category).filter(Boolean)),
                ].sort(),
              ].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="blog-author" style={labelStyle}>
              Author
            </label>
            <input
              id="blog-author"
              type="text"
              data-ocid="admin.blog.author.input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label htmlFor="blog-excerpt" style={labelStyle}>
            Excerpt
          </label>
          <textarea
            id="blog-excerpt"
            data-ocid="admin.blog.excerpt.textarea"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            placeholder="Brief summary of the post (max 160 characters)..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "12px",
              color: excerpt.length > 160 ? "#f87171" : "#7A7D90",
              fontWeight: excerpt.length > 160 ? 600 : 400,
            }}
          >
            {excerpt.length} / 160 characters
          </p>
        </div>

        <div>
          <label htmlFor="blog-image" style={labelStyle}>
            Featured Image
          </label>
          {featuredImageUrl ? (
            <div style={{ position: "relative" }}>
              <div
                style={{
                  paddingBottom: "56.25%",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "8px",
                  border: "1px solid #1C1F33",
                }}
              >
                <img
                  src={featuredImageUrl}
                  alt="Featured post banner"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeaturedImageUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "block",
                width: "100%",
                border: "2px dashed #1C1F33",
                borderRadius: "8px",
                padding: "32px",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(19,21,36,0.5)",
                transition: "border-color 0.15s",
              }}
            >
              <Image
                size={28}
                color="#7A7D90"
                style={{ margin: "0 auto 8px" }}
              />
              <p style={{ margin: 0, fontSize: "13px", color: "#7A7D90" }}>
                {uploadingImage
                  ? "Uploading..."
                  : "Click to upload a featured banner"}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "11px",
                  color: "#7A7D90",
                }}
              >
                Displays as 16:9 \u2014 any size works
              </p>
            </button>
          )}
          <input
            ref={fileInputRef}
            id="blog-image"
            type="file"
            data-ocid="admin.blog.image.upload_button"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
          {/* Paste-URL fallback — works even when upload extension is unavailable */}
          <div style={{ marginTop: "10px" }}>
            <input
              type="text"
              data-ocid="admin.blog.image.url_input"
              placeholder="or paste a URL..."
              value={featuredImageUrl ?? ""}
              onChange={(e) =>
                setFeaturedImageUrl(e.target.value.trim() || null)
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(94,240,138,0.3)",
                fontSize: "13px",
                color: "#5EF08A",
                background: "rgba(0,0,0,0.6)",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "'Courier New', monospace",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#5EF08A";
                e.currentTarget.style.boxShadow =
                  "0 0 0 2px rgba(94,240,138,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(94,240,138,0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          {imageUploadError && (
            <p
              data-ocid="admin.blog.image.error_state"
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#f87171",
                fontWeight: 500,
              }}
            >
              {imageUploadError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="blog-image-caption" style={labelStyle}>
            Featured Image Caption{" "}
            <span
              style={{
                color: "#6B7280",
                fontWeight: 400,
                textTransform: "none",
                fontSize: "11px",
              }}
            >
              (optional)
            </span>
          </label>
          <input
            id="blog-image-caption"
            type="text"
            data-ocid="admin.blog.image_caption.input"
            value={featuredImageCaption}
            onChange={(e) => setFeaturedImageCaption(e.target.value)}
            placeholder="e.g. Hero photo taken in downtown Chicago"
            style={inputStyle}
          />
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#7A7D90" }}>
            Displayed below the featured image on the public post page.
          </p>
        </div>

        <div>
          <label htmlFor="blog-body" style={labelStyle}>
            Body
          </label>
          <textarea
            id="blog-body"
            data-ocid="admin.blog.body.editor"
            value={editorBody}
            onChange={(e) => setEditorBody(e.target.value)}
            placeholder="Write post body (HTML or plain text)..."
            style={{
              ...inputStyle,
              minHeight: "300px",
              padding: "16px",
              fontSize: "15px",
              lineHeight: "1.7",
              resize: "vertical",
              border: "1px solid #1C1F33",
            }}
          />
        </div>

        <div>
          <label htmlFor="blog-seo-description" style={labelStyle}>
            SEO Meta Description{" "}
            <span
              style={{
                color: "#6B7280",
                fontWeight: 400,
                textTransform: "none",
                fontSize: "11px",
              }}
            >
              (optional)
            </span>
          </label>
          <textarea
            id="blog-seo-description"
            data-ocid="admin.blog.seo_description.textarea"
            value={seoMetaDescription}
            onChange={(e) => setSeoMetaDescription(e.target.value)}
            rows={3}
            placeholder="Brief description for search engines (recommended ≤160 characters)..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div>
          <label htmlFor="blog-seo-keywords" style={labelStyle}>
            SEO Meta Keywords{" "}
            <span
              style={{
                color: "#6B7280",
                fontWeight: 400,
                textTransform: "none",
                fontSize: "11px",
              }}
            >
              (optional)
            </span>
          </label>
          <input
            id="blog-seo-keywords"
            type="text"
            data-ocid="admin.blog.seo_keywords.input"
            value={seoMetaKeywords}
            onChange={(e) => setSeoMetaKeywords(e.target.value)}
            placeholder="e.g. web design, small business, booking software"
            style={inputStyle}
          />
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#7A7D90" }}>
            Comma-separated keywords for search engine indexing.
          </p>
        </div>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "#7A7D90",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "6px",
            }}
          >
            Status
          </legend>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setStatus("draft")}
              style={{
                padding: "8px 20px",
                borderRadius: "6px",
                border: "1px solid",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background:
                  status === "draft" ? "rgba(94,240,138,0.1)" : "transparent",
                color: status === "draft" ? "#5EF08A" : "#7A7D90",
                borderColor:
                  status === "draft" ? "rgba(94,240,138,0.3)" : "#1C1F33",
              }}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setStatus("published")}
              style={{
                padding: "8px 20px",
                borderRadius: "6px",
                border: "1px solid",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background:
                  status === "published"
                    ? "rgba(94,240,138,0.15)"
                    : "transparent",
                color: status === "published" ? "#5EF08A" : "#7A7D90",
                borderColor:
                  status === "published" ? "rgba(94,240,138,0.4)" : "#1C1F33",
              }}
            >
              Published
            </button>
          </div>
        </fieldset>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            data-ocid="admin.blog.save.button"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "rgba(94,240,138,0.5)" : "#5EF08A",
              color: "#0A0B14",
              border: "none",
              borderRadius: "7px",
              padding: "11px 28px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : editingPost ? "Update Post" : "Save Post"}
          </button>
          {saveError &&
            ![
              "Title is required.",
              "Slug is required.",
              "Excerpt must be 160 characters or fewer.",
            ].includes(saveError) && (
              <span
                data-ocid="admin.blog.save_error_state"
                style={{
                  color: "#f87171",
                  fontSize: 13,
                  fontWeight: 500,
                  marginLeft: 12,
                }}
              >
                {saveError}
              </span>
            )}
        </div>
        {saveErrorDetail && (
          <div style={{ color: "#f87171", fontSize: 11, marginTop: 4 }}>
            {saveErrorDetail}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
