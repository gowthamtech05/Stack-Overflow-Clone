import { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function ImageModal({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80"
      >
        ×
      </button>
      <img
        src={src}
        alt="fullscreen"
        className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function Posts() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postLimit, setPostLimit] = useState(null);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/posts");
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostLimit = async () => {
    if (!user) return;
    try {
      const { data } = await API.get("/posts/limit");
      setPostLimit(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
    if (user) fetchPostLimit();
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      setError("Write something or attach media.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const formData = new FormData();
      formData.append("content", content);
      if (mediaFile) formData.append("media", mediaFile);
      await API.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setContent("");
      clearMedia();
      fetchPosts();
      fetchPostLimit();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await API.post(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: data.likes } : p)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Delete this post?")) return;
    try {
      await API.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      fetchPostLimit();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete post.");
    }
  };

  const canPost = postLimit && postLimit.remaining > 0;
  const noFriends = postLimit && postLimit.friendCount === 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] text-orange-500 uppercase tracking-widest mb-0.5">
            Feed
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Community
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            Posts from you and your friends
          </p>
        </div>
      </div>

      {user ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl mb-5 overflow-hidden">
          {noFriends ? (
            <div className="p-6 text-center">
              <p className="text-2xl mb-2">🤝</p>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-3">
                You need at least <strong>1 friend</strong> to post.
              </p>
              <Link
                to="/friends"
                className="inline-block bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
              >
                Find Friends
              </Link>
            </div>
          ) : !canPost ? (
            <div className="p-6 text-center">
              <p className="text-2xl mb-2">⏳</p>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-2">
                You've reached your posting limit for today.
              </p>
              <Link
                to="/friends"
                className="text-orange-500 text-[13px] hover:underline"
              >
                Add more friends for more posts →
              </Link>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold uppercase shrink-0 text-[13px]">
                  {user.name?.[0]}
                </div>
                <div className="flex-1">
                  <textarea
                    rows={3}
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full text-[14px] bg-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none"
                  />
                  {mediaPreview && (
                    <div className="relative mt-2 inline-block">
                      {mediaType === "image" ? (
                        <img
                          src={mediaPreview}
                          alt="preview"
                          className="max-h-48 rounded-xl border border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <video
                          src={mediaPreview}
                          controls
                          className="max-h-48 rounded-xl"
                        />
                      )}
                      <button
                        onClick={clearMedia}
                        className="absolute top-1 right-1 w-6 h-6 bg-gray-900/70 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-[12px] mt-2 ml-12">{error}</p>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Photo / Video
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {postLimit && (
                    <span className="text-[12px] text-gray-400">
                      {postLimit.remaining} post
                      {postLimit.remaining !== 1 ? "s" : ""} left
                    </span>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-colors"
                  >
                    {submitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-center mb-5">
          <p className="text-[14px] text-gray-400">
            <Link
              to="/login"
              className="text-orange-500 hover:underline font-semibold"
            >
              Log in
            </Link>
            {" or "}
            <Link
              to="/register"
              className="text-orange-500 hover:underline font-semibold"
            >
              sign up
            </Link>
            {" to post."}
          </p>
        </div>
      )}

      {postLimit && (
        <div className="mb-5 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-[12px] text-gray-400 flex justify-between flex-wrap gap-1">
          <span>
            0 friends = no posts · 1 = 1/day · 2 = 2/day · 10+ = unlimited
          </span>
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            {postLimit.friendCount} friend
            {postLimit.friendCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-[13px] text-gray-400">
            No posts yet. Be the first to share something!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              user={user}
              onLike={handleLike}
              onDelete={handleDeletePost}
              onRefresh={fetchPosts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, user, onLike, onDelete, onRefresh }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState(null);
  const [localPost, setLocalPost] = useState(post);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const isLiked = user && localPost.likes?.includes(user._id);
  const isPostOwner = user && localPost.user?._id === user._id;

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      setSubmittingComment(true);
      const { data } = await API.post(`/posts/${localPost._id}/comment`, {
        text: comment,
      });
      setLocalPost(data);
      setComment("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    try {
      const { data } = await API.delete(
        `/posts/${localPost._id}/comment/${commentId}`,
      );
      setLocalPost(data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(
      `${window.location.origin}/posts/${localPost._id}`,
    );
    alert("Link copied!");
  };

  return (
    <>
      {fullscreenImg && (
        <ImageModal
          src={fullscreenImg}
          onClose={() => setFullscreenImg(null)}
        />
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold uppercase shrink-0 text-[13px]">
            {localPost.user?.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${localPost.user?._id}`}
              className="font-semibold text-[14px] text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
            >
              {localPost.user?.name}
            </Link>
            <p className="text-[11px] text-gray-400">
              {timeAgo(localPost.createdAt)}
            </p>
          </div>
          {isPostOwner && (
            <button
              onClick={() => onDelete(localPost._id)}
              title="Delete post"
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>

        {localPost.content && (
          <p className="px-4 pb-3 text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed">
            {localPost.content}
          </p>
        )}

        {localPost.mediaUrl && (
          <div className="border-t border-gray-100 dark:border-gray-800">
            {localPost.mediaType === "video" ? (
              <video
                src={localPost.mediaUrl}
                controls
                className="w-full max-h-96 object-cover"
              />
            ) : (
              <img
                src={localPost.mediaUrl}
                alt="post"
                className="w-full max-h-96 object-cover cursor-zoom-in"
                onClick={() => setFullscreenImg(localPost.mediaUrl)}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2 text-[12px] text-gray-400 border-t border-gray-100 dark:border-gray-800">
          <span>{localPost.likes?.length || 0} likes</span>
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {localPost.comments?.length || 0} comments
          </button>
        </div>

        <div className="flex divide-x divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800">
          {[
            {
              label: isLiked ? "Liked" : "Like",
              icon: (
                <svg
                  className="w-4 h-4"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
              ),
              onClick: () => user && onLike(localPost._id),
              active: isLiked,
            },
            {
              label: "Comment",
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              ),
              onClick: () => setShowComments(!showComments),
            },
            {
              label: "Share",
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              ),
              onClick: handleShare,
            },
          ].map(({ label, icon, onClick, active }) => (
            <button
              key={label}
              onClick={onClick}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? "text-orange-500 bg-orange-50 dark:bg-orange-900/10"
                  : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {showComments && (
          <div className="px-4 py-3 space-y-3 border-t border-gray-100 dark:border-gray-800">
            {localPost.comments?.map((c) => {
              const isCommentOwner = user && c.user?._id === user._id;
              return (
                <div key={c._id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                    {c.user?.name?.[0]}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/profile/${c.user?._id}`}
                        className="text-[12px] font-semibold text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
                      >
                        {c.user?.name}
                      </Link>
                      {isCommentOwner && (
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          title="Delete"
                          className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-600 dark:text-gray-300 mt-0.5">
                      {c.text}
                    </p>
                  </div>
                </div>
              );
            })}

            {user && (
              <div className="flex gap-2 mt-2">
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                  {user.name?.[0]}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    placeholder="Write a comment..."
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-orange-400 transition-colors placeholder-gray-400"
                  />
                  <button
                    onClick={handleComment}
                    disabled={submittingComment || !comment.trim()}
                    className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
