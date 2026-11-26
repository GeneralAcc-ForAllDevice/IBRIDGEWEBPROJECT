import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import "./Newsfeed.css";

const REACTION_META = {
  like: { emoji: "👍", label: "Like", color: "#2563eb", weight: 1.0 },
  love: { emoji: "❤️", label: "Love", color: "#e11d48", weight: 1.6 },
  haha: { emoji: "😂", label: "Haha", color: "#eab308", weight: 1.35 },
  wow: { emoji: "😮", label: "Wow", color: "#f97316", weight: 1.4 },
  care: { emoji: "🤗", label: "Care", color: "#f59e0b", weight: 1.45 },
  sad: { emoji: "😢", label: "Sad", color: "#64748b", weight: 1.2 },
  angry: { emoji: "😡", label: "Angry", color: "#dc2626", weight: 1.25 },
};

const REACTION_KEYS = Object.keys(REACTION_META);

const toTimestamp = (dateInput, fallback = 0) => {
  if (!dateInput) return fallback;
  const ts = new Date(dateInput).getTime();
  return Number.isFinite(ts) ? ts : fallback;
};

// Login ဝင်ထားမှသာ User ID ရမည် (Guest fallback မသုံးပါ)
const getAuthenticatedUserId = (user, token) => {
  if (!token && !user) return null;
  if (user?._id) return String(user._id);
  if (user?.id) return String(user.id);
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.id) return String(payload.id);
      if (payload?._id) return String(payload._id);
      if (payload?.userId) return String(payload.userId);
    } catch {
      return null;
    }
  }
  return null;
};

const getCurrentUserName = (user) => {
  if (!user) return "";
  if (user?.name) return user.name;
  if (user?.username) return user.username;
  if (user?.email) return user.email.split("@")[0];
  return "IBRIDGE Member";
};

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "ယခုလေးတင်";
  const ts = toTimestamp(dateInput, NaN);
  if (!Number.isFinite(ts)) return "ယခုလေးတင်";

  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "ယခုလေးတင်";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} မိနစ်အကြာ`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} နာရီအကြာ`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} ရက်အကြာ`;
  return new Date(ts).toLocaleDateString("my-MM");
};

const isVideoMedia = (item) => {
  if (!item) return false;
  if (item?.mediaType === "video" || item?.isReel) return true;
  const target = item?.videoUrl || item?.image || item?.tempMediaUrl || "";
  if (
    /^data:video\//i.test(target) ||
    (/^blob:/i.test(target) && item?.mediaType === "video")
  ) {
    return true;
  }
  return /\.(mp4|webm|mov|m4v|avi|mkv|m3u8)(\?.*)?$/i.test(target);
};

const extractCreatedPost = (payload, fallbackMeta = {}) => {
  const raw =
    payload?.data?.post ||
    payload?.data ||
    payload?.post ||
    payload?.lastCompletedPost ||
    payload;

  if (!raw || typeof raw !== "object") return null;
  const normalizedId = raw._id || raw.id || `post_${Date.now()}`;

  return {
    ...fallbackMeta,
    ...raw,
    _id: normalizedId,
    author: raw.author || fallbackMeta.author || "IBRIDGE Member",
    userId: raw.userId || fallbackMeta.userId,
    content: raw.content ?? fallbackMeta.content ?? "",
    createdAt: raw.createdAt || new Date().toISOString(),
    isPosting: false,
  };
};

// Facebook-style Feed Ranking Algorithm
const rankFeedPosts = (
  posts = [],
  sortMode = "smart",
  { currentUserId = null, hiddenPostIds = new Set(), authorAffinity = {} } = {}
) => {
  if (!Array.isArray(posts)) return [];

  const visiblePosts = posts.filter((p) => {
    const id = p?._id || p?.id;
    return id && !hiddenPostIds.has(String(id));
  });

  if (sortMode === "latest") {
    return [...visiblePosts].sort((a, b) => {
      if (a?.isPosting && !b?.isPosting) return -1;
      if (!a?.isPosting && b?.isPosting) return 1;
      return toTimestamp(b?.createdAt, 0) - toTimestamp(a?.createdAt, 0);
    });
  }

  const now = Date.now();
  return [...visiblePosts].sort((a, b) => {
    const scorePost = (p) => {
      if (p?.isPosting) return 1e13;

      const reactions = Array.isArray(p?.reactions) ? p.reactions : [];
      const comments = Array.isArray(p?.comments) ? p.comments : [];
      const sharesCount = Number(p?.sharesCount || p?.shares || 0);

      const reactionScore = reactions.reduce((sum, r) => {
        const w = REACTION_META[r?.type]?.weight || 1.0;
        return sum + w * 2.2;
      }, 0);

      const commentScore = comments.length * 4.0;
      const shareScore = sharesCount * 5.0;
      const mediaBoost = p?.image || p?.tempMediaUrl ? 2.5 : 0;

      const authorKey = String(p?.userId || p?.author || "");
      const affinityBoost =
        authorKey && authorAffinity[authorKey]
          ? authorAffinity[authorKey] * 4.5
          : 0;

      const createdTs = toTimestamp(p?.createdAt, now);
      const ageMinutes = Math.max(0.1, (now - createdTs) / (1000 * 60));
      const justPostedBoost =
        currentUserId &&
        String(p?.userId) === String(currentUserId) &&
        ageMinutes < 10
          ? 25
          : 0;

      const ageHours = Math.max(0.1, ageMinutes / 60);
      const gravity = sortMode === "trending" ? 1.05 : 1.35;
      const recencyDecay = Math.pow(ageHours + 2, gravity);

      const totalEngagement =
        reactionScore +
        commentScore +
        shareScore +
        mediaBoost +
        affinityBoost +
        justPostedBoost +
        1;

      return totalEngagement / recencyDecay;
    };

    return scorePost(b) - scorePost(a);
  });
};

// YouTube Shorts / Reels Ranking Algorithm
const rankReelVideos = (reels = [], reelMetrics = {}) => {
  if (!Array.isArray(reels)) return [];
  const now = Date.now();

  return [...reels].sort((a, b) => {
    const scoreReel = (r) => {
      const id = String(r?._id || r?.id || "");
      const metric = reelMetrics[id] || {};
      const reactions = Array.isArray(r?.reactions) ? r.reactions : [];
      const comments = Array.isArray(r?.comments) ? r.comments : [];
      const views = Math.max(1, Number(r?.views || metric.views || 1));

      const likes = reactions.length + Number(metric.extraLikes || 0);
      const engagementRate = (likes * 2.0 + comments.length * 3.5) / views;
      const completionRate = Math.min(1.5, Number(metric.completionRate || 0.5));
      const watchSeconds = Number(metric.watchSeconds || 0);

      const ageHours = Math.max(
        0.2,
        (now - toTimestamp(r?.createdAt, now)) / (1000 * 60 * 60)
      );
      const freshness = 1 / Math.pow(ageHours + 1.5, 0.85);

      return (
        engagementRate * 25 +
        completionRate * 12 +
        Math.min(10, watchSeconds / 15) +
        freshness * 5
      );
    };

    return scoreReel(b) - scoreReel(a);
  });
};
const Newsfeed = () => {
  const store = useContext(StoreContext) || {};
  const {
    url = "",
    token = localStorage.getItem("token") || "",
    user = null,
    activeUpload,
    startBackgroundUpload,
    cancelBackgroundUpload,
    setShowLogin,
  } = store;

  const isUploading = Boolean(activeUpload?.isUploading);

  const currentUserId = useMemo(
    () => getAuthenticatedUserId(user, token),
    [user, token]
  );
  const isAuthenticated = Boolean(currentUserId);
  const displayAuthor = useMemo(
    () => (isAuthenticated ? getCurrentUserName(user) : ""),
    [isAuthenticated, user]
  );

  const [posts, setPosts] = useState([]);
  const [sortMode, setSortMode] = useState("smart");
  const [newPostText, setNewPostText] = useState("");
  const [isReelPost, setIsReelPost] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [loading, setLoading] = useState(false);
  const [fetchingPosts, setFetchingPosts] = useState(true);

  const [savedPostIds, setSavedPostIds] = useState(() => {
    try {
      const raw = JSON.parse(
        localStorage.getItem("ibridge_saved_posts") || "[]"
      );
      return new Set(Array.isArray(raw) ? raw.map(String) : []);
    } catch {
      return new Set();
    }
  });
  const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set());
  const [authorAffinity, setAuthorAffinity] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("ibridge_author_affinity") || "{}") ||
        {}
      );
    } catch {
      return {};
    }
  });

  // Reels state
  const [activeReelIndex, setActiveReelIndex] = useState(null);
  const [reelsMuted, setReelsMuted] = useState(false);
  const [reelMetrics, setReelMetrics] = useState({});
  const [swipeDeltaY, setSwipeDeltaY] = useState(0);

  const [openReactionPickerId, setOpenReactionPickerId] = useState(null);
  const [openCommentBoxId, setOpenCommentBoxId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  const videoRefs = useRef(new Map());
  const reelVideoRef = useRef(null);
  const reelWatchStartRef = useRef(null);
  const pickerCloseTimer = useRef(null);
  const uploadAbortControllerRef = useRef(null);
  const touchStartYRef = useRef(null);
  const lockedReelIdsRef = useRef(null);

  const upsertPostToFeed = useCallback((incomingPost, replaceTempId = null) => {
    if (!incomingPost) return;
    const targetId = String(incomingPost._id || incomingPost.id || "");
    if (!targetId) return;

    setPosts((prev) => {
      const withoutTemp = replaceTempId
        ? prev.filter((p) => String(p._id || p.id) !== String(replaceTempId))
        : prev.filter(
            (p) => !p.isPosting || String(p._id || p.id) !== targetId
          );

      const existingIdx = withoutTemp.findIndex(
        (p) => String(p._id || p.id) === targetId
      );

      if (existingIdx !== -1) {
        const copy = [...withoutTemp];
        copy[existingIdx] = {
          ...copy[existingIdx],
          ...incomingPost,
          isPosting: false,
        };
        return copy;
      }

      return [{ ...incomingPost, isPosting: false }, ...withoutTemp];
    });
  }, []);

  const requireAuth = useCallback(
    (actionLabel = "ဤလုပ်ဆောင်ချက်ကို လုပ်ဆောင်ရန်") => {
      if (isAuthenticated) return true;
      toast.info(`${actionLabel} ဦးစွာ Login ဝင်ပါ`);
      if (typeof setShowLogin === "function") {
        setShowLogin(true);
      }
      return false;
    },
    [isAuthenticated, setShowLogin]
  );

  const bumpAuthorAffinity = useCallback((authorKey, delta = 1) => {
    if (!authorKey) return;
    setAuthorAffinity((prev) => {
      const key = String(authorKey);
      const nextValue = Math.min(
        20,
        Math.max(0, (Number(prev[key]) || 0) + delta)
      );
      const updated = { ...prev, [key]: nextValue };
      try {
        localStorage.setItem("ibridge_author_affinity", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const pauseAllExcept = useCallback((activePostId = null) => {
    videoRefs.current.forEach((videoEl, id) => {
      if (id !== activePostId && videoEl && !videoEl.paused) {
        videoEl.pause();
      }
    });
  }, []);

  const handleVideoPlay = useCallback(
    (activePostId) => {
      pauseAllExcept(activePostId);
    },
    [pauseAllExcept]
  );

  const registerVideoRef = useCallback((postId, el) => {
    if (el) {
      videoRefs.current.set(postId, el);
    } else {
      videoRefs.current.delete(postId);
    }
  }, []);

  const rankedPosts = useMemo(
    () =>
      rankFeedPosts(posts, sortMode, {
        currentUserId,
        hiddenPostIds,
        authorAffinity,
      }),
    [posts, sortMode, currentUserId, hiddenPostIds, authorAffinity]
  );

  const shortReels = useMemo(() => {
    const videoItems = posts.filter((p) => {
      if (!p || p.isPosting) return false;
      const id = p._id || p.id;
      if (id && hiddenPostIds.has(String(id))) return false;
      return isVideoMedia(p);
    });
    return rankReelVideos(videoItems, reelMetrics);
  }, [posts, hiddenPostIds, reelMetrics]);

  // Reel viewer ဖွင့်ထားချိန် Like/Reaction ပေးလည်း ဗီဒီယို order မပြောင်းအောင် lock လုပ်ခြင်း
  useEffect(() => {
    if (activeReelIndex === null) {
      lockedReelIdsRef.current = null;
    } else if (!lockedReelIdsRef.current && Array.isArray(shortReels)) {
      lockedReelIdsRef.current = shortReels.map((r) => String(r._id || r.id));
    }
  }, [activeReelIndex, shortReels]);

  const orderedShortReels = useMemo(() => {
    if (activeReelIndex === null || !Array.isArray(lockedReelIdsRef.current)) {
      return shortReels;
    }

    const byId = new Map(
      shortReels.map((r) => [String(r._id || r.id), r])
    );
    const ordered = [];

    for (const id of lockedReelIdsRef.current) {
      if (byId.has(id)) {
        ordered.push(byId.get(id));
        byId.delete(id);
      }
    }

    byId.forEach((rem) => ordered.push(rem));
    return ordered;
  }, [shortReels, activeReelIndex]);

  // Reel modal ဖွင့်ထားချိန် body scroll lock + Escape / Arrow keys
  useEffect(() => {
    if (activeReelIndex === null) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveReelIndex(null);
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        setActiveReelIndex((prev) =>
          prev === null || !orderedShortReels.length
            ? null
            : (prev + 1) % orderedShortReels.length
        );
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        setActiveReelIndex((prev) =>
          prev === null || !orderedShortReels.length
            ? null
            : (prev - 1 + orderedShortReels.length) % orderedShortReels.length
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeReelIndex, orderedShortReels.length]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoEl = entry.target;
          if (
            videoEl &&
            videoEl.tagName === "VIDEO" &&
            !entry.isIntersecting &&
            !videoEl.paused
          ) {
            videoEl.pause();
          }
        });
      },
      { threshold: 0.35 }
    );

    videoRefs.current.forEach((videoEl) => {
      if (videoEl) observer.observe(videoEl);
    });

    return () => observer.disconnect();
  }, [rankedPosts]);

  const fetchPosts = useCallback(async () => {
    if (!url) {
      setFetchingPosts(false);
      return;
    }

    try {
      setFetchingPosts(true);
      const res = await axios.get(`${url}/api/post/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPosts(res.data.data);
      } else if (Array.isArray(res.data?.posts)) {
        setPosts(res.data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Post များ ဆွဲယူရာတွင် အမှားရှိပါသည်");
    } finally {
      setFetchingPosts(false);
    }
  }, [url, token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const completedPost = extractCreatedPost(activeUpload?.lastCompletedPost);
    if (!completedPost?._id) return;
    upsertPostToFeed(completedPost);
  }, [activeUpload?.lastCompletedPost, upsertPostToFeed]);

  useEffect(() => {
    return () => {
      if (mediaPreview && mediaPreview.startsWith("blob:")) {
        URL.revokeObjectURL(mediaPreview);
      }
      if (pickerCloseTimer.current) {
        clearTimeout(pickerCloseTimer.current);
      }
    };
  }, [mediaPreview]);

  const handleMediaChange = (e) => {
    if (!requireAuth("ပုံ သို့မဟုတ် ဗီဒီယို ရွေးချယ်ရန်")) {
      e.target.value = "";
      return;
    }

    const file = e.target.files?.item(0);
    if (!file) return;

    if (mediaPreview && mediaPreview.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview);
    }

    const isVid =
      file.type.startsWith("video/") ||
      /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name);

    setMediaFile(file);
    setMediaType(isVid ? "video" : "image");
    if (!isVid) {
      setIsReelPost(false);
    }
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearSelectedMedia = () => {
    if (mediaPreview && mediaPreview.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("image");
    setIsReelPost(false);
  };

  const handleCancelUpload = useCallback(() => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
      uploadAbortControllerRef.current = null;
    }

    if (typeof cancelBackgroundUpload === "function") {
      cancelBackgroundUpload();
    } else if (typeof activeUpload?.cancel === "function") {
      activeUpload.cancel();
    }

    setLoading(false);
    setPosts((prev) => prev.filter((p) => !p.isPosting));
    toast.info("Post တင်နေခြင်းကို ရပ်လိုက်ပါပြီ");
  }, [cancelBackgroundUpload, activeUpload]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!requireAuth("Post တင်ရန်")) return;

    const trimmedText = newPostText.trim();
    if (!trimmedText && !mediaFile) {
      toast.warning("စာသား၊ ဓာတ်ပုံ သို့မဟုတ် ဗီဒီယို တစ်ခုခု ထည့်ပေးပါ");
      return;
    }

    if (isUploading || loading) return;

    pauseAllExcept(null);

    const textToSend = trimmedText;
    const fileToSend = mediaFile;
    const currentMediaType = mediaType;
    const reelFlag = currentMediaType === "video" && isReelPost;
    const tempPreviewUrl = mediaPreview;

    const tempId = `temp_post_${Date.now()}`;
    const optimisticPost = {
      _id: tempId,
      author: displayAuthor,
      userId: currentUserId,
      content: textToSend,
      mediaType: currentMediaType,
      isReel: reelFlag,
      tempMediaUrl: tempPreviewUrl,
      createdAt: new Date().toISOString(),
      reactions: [],
      comments: [],
      isPosting: true,
    };

    upsertPostToFeed(optimisticPost);

    setNewPostText("");
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("image");
    setIsReelPost(false);

    const controller = new AbortController();
    uploadAbortControllerRef.current = controller;

    const fallbackMeta = {
      author: displayAuthor,
      userId: currentUserId,
      content: textToSend,
      mediaType: currentMediaType,
      isReel: reelFlag,
    };

    if (typeof startBackgroundUpload === "function") {
      setLoading(true);
      try {
        const result = await startBackgroundUpload({
          file: fileToSend,
          author: displayAuthor,
          userId: currentUserId,
          content: textToSend,
          mediaType: currentMediaType,
          isReel: reelFlag,
          signal: controller.signal,
          onSuccess: (newPostData) => {
            const normalized = extractCreatedPost(newPostData, fallbackMeta);
            if (normalized) {
              upsertPostToFeed(normalized, tempId);
            }
          },
        });

        const directNormalized = extractCreatedPost(result, fallbackMeta);
        if (
          directNormalized &&
          (directNormalized._id !== tempId || !fileToSend)
        ) {
          upsertPostToFeed(directNormalized, tempId);
        }
      } catch (err) {
        setPosts((prev) => prev.filter((p) => p._id !== tempId));
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
          toast.info("Upload ရပ်တန့်သွားပါပြီ");
        } else {
          console.error("Background upload error:", err);
          toast.error("Post တင်ရာတွင် အမှားရှိပါသည်");
        }
      } finally {
        if (tempPreviewUrl && tempPreviewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(tempPreviewUrl);
        }
        uploadAbortControllerRef.current = null;
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("content", textToSend);
      formData.append("author", displayAuthor);
      formData.append("userId", currentUserId);
      formData.append("mediaType", currentMediaType);
      formData.append("isReel", String(reelFlag));
      if (fileToSend) {
        formData.append("media", fileToSend);
      }

      const res = await axios.post(`${url}/api/post/create`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });

      const created = extractCreatedPost(res.data, fallbackMeta);
      if (res.data?.success !== false && created) {
        upsertPostToFeed(created, tempId);
        toast.success("Post တင်ပြီးပါပြီ");
      } else {
        setPosts((prev) => prev.filter((p) => p._id !== tempId));
      }
    } catch (error) {
      setPosts((prev) => prev.filter((p) => p._id !== tempId));
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        toast.info("Post တင်ခြင်းကို ရပ်လိုက်ပါပြီ");
      } else {
        console.error("Error creating post:", error);
        toast.error("Post တင်ရာတွင် အမှားရှိပါသည်");
      }
    } finally {
      if (tempPreviewUrl && tempPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(tempPreviewUrl);
      }
      uploadAbortControllerRef.current = null;
      setLoading(false);
    }
  };

  const handleReact = async (postId, type = "like") => {
    if (!requireAuth("Reaction ပေးရန်")) return;
    setOpenReactionPickerId(null);

    const normalizedUserId = String(currentUserId);
    let targetAuthorKey = "";
    let snapshot = null;

    setPosts((prev) => {
      snapshot = prev;
      return prev.map((post) => {
        if (post._id !== postId) return post;
        targetAuthorKey = String(post.userId || post.author || "");
        const list = Array.isArray(post.reactions) ? [...post.reactions] : [];
        const idx = list.findIndex(
          (r) => String(r.userId) === normalizedUserId
        );

        if (idx !== -1) {
          if (list[idx].type === type) {
            list.splice(idx, 1);
          } else {
            list[idx] = { ...list[idx], type };
          }
        } else {
          list.push({ userId: normalizedUserId, userName: displayAuthor, type });
        }

        return { ...post, reactions: list };
      });
    });

    bumpAuthorAffinity(targetAuthorKey, 0.75);

    try {
      const res = await axios.post(
        `${url}/api/post/react`,
        { postId, userId: normalizedUserId, type },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data?.success && Array.isArray(res.data.reactions)) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, reactions: res.data.reactions } : p
          )
        );
      } else if (snapshot) {
        setPosts(snapshot);
      }
    } catch (error) {
      console.error("Reaction error:", error);
      if (snapshot) setPosts(snapshot);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!requireAuth("Comment ရေးရန်")) return;

    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    const tempComment = {
      _id: `temp_${Date.now()}`,
      user: displayAuthor,
      userId: String(currentUserId),
      text,
      createdAt: new Date().toISOString(),
    };

    let targetAuthorKey = "";
    let snapshot = null;

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    setPosts((prev) => {
      snapshot = prev;
      return prev.map((post) => {
        if (post._id !== postId) return post;
        targetAuthorKey = String(post.userId || post.author || "");
        return {
          ...post,
          comments: [...(post.comments || []), tempComment],
        };
      });
    });

    bumpAuthorAffinity(targetAuthorKey, 1.5);

    try {
      const res = await axios.post(
        `${url}/api/post/comment`,
        {
          postId,
          user: displayAuthor,
          userId: String(currentUserId),
          text,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data?.success && Array.isArray(res.data.comments)) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, comments: res.data.comments } : p
          )
        );
      } else if (snapshot) {
        setPosts(snapshot);
      }
    } catch (error) {
      console.error("Comment error:", error);
      toast.error("Comment တင်၍မရပါ");
      if (snapshot) setPosts(snapshot);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!requireAuth("Post ဖျက်ရန်")) return;

    let snapshot = null;
    setPosts((prev) => {
      snapshot = prev;
      return prev.filter((p) => p._id !== postId);
    });

    try {
      const res = await axios.post(
        `${url}/api/post/delete`,
        { postId, userId: currentUserId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.success) {
        toast.success("Post ဖျက်ပြီးပါပြီ");
      } else {
        toast.error(res.data?.message || "Post ဖျက်၍မရပါ");
        if (snapshot) setPosts(snapshot);
      }
    } catch (error) {
      console.error("Delete post error:", error);
      toast.error("Post ဖျက်ရာတွင် အမှားရှိပါသည်");
      if (snapshot) setPosts(snapshot);
    }
  };

  const handleToggleSavePost = useCallback(
    (postId) => {
      if (!requireAuth("Post သိမ်းဆည်းရန်")) return;
      const key = String(postId);
      setSavedPostIds((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
          toast.info("Saved list ထဲမှ ဖယ်ရှားလိုက်ပါပြီ");
        } else {
          next.add(key);
          toast.success("Post ကို သိမ်းဆည်းပြီးပါပြီ");
        }
        try {
          localStorage.setItem(
            "ibridge_saved_posts",
            JSON.stringify([...next])
          );
        } catch {
          // ignore
        }
        return next;
      });
    },
    [requireAuth]
  );

  const handleHidePost = useCallback(
    (post) => {
      const id = String(post?._id || post?.id || "");
      if (!id) return;
      setHiddenPostIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      const authorKey = String(post?.userId || post?.author || "");
      bumpAuthorAffinity(authorKey, -1.5);
      toast.info("ဒီ Post မျိုးကို နည်းနိုင်သမျှ လျှော့ပြပါမည်");
    },
    [bumpAuthorAffinity]
  );

  const handleSharePost = useCallback(async (post) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.author || "IBRIDGE"} Post`,
          text: post.content || "",
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Post Link ကို Copy ကူးပြီးပါပြီ");
      }
      setPosts((prev) =>
        prev.map((p) =>
          p._id === post._id
            ? { ...p, sharesCount: Number(p.sharesCount || p.shares || 0) + 1 }
            : p
        )
      );
    } catch {
      // ignore cancelled share
    }
  }, []);

  const openPickerForPost = (postId) => {
    if (pickerCloseTimer.current) clearTimeout(pickerCloseTimer.current);
    setOpenReactionPickerId(postId);
  };

  const scheduleClosePicker = () => {
    if (pickerCloseTimer.current) clearTimeout(pickerCloseTimer.current);
    pickerCloseTimer.current = setTimeout(() => {
      setOpenReactionPickerId(null);
    }, 150);
  };

  const recordReelWatchProgress = useCallback((reel, videoEl) => {
    if (!reel?._id) return;
    const startTs = reelWatchStartRef.current;
    reelWatchStartRef.current = Date.now();
    if (!startTs) return;

    const watchedSec = Math.max(0, (Date.now() - startTs) / 1000);
    const duration =
      videoEl?.duration && Number.isFinite(videoEl.duration)
        ? Math.max(1, videoEl.duration)
        : 15;
    const ratio = Math.min(1.5, watchedSec / duration);

    setReelMetrics((prev) => {
      const current = prev[reel._id] || {
        views: 0,
        watchSeconds: 0,
        completionRate: 0.5,
      };
      return {
        ...prev,
        [reel._id]: {
          ...current,
          watchSeconds: current.watchSeconds + watchedSec,
          completionRate: Number(
            ((current.completionRate + ratio) / 2).toFixed(2)
          ),
        },
      };
    });
  }, []);

  const openReelAtIndex = useCallback(
    (index) => {
      if (!orderedShortReels.length) return;
      pauseAllExcept(null);
      const safeIndex = Math.max(
        0,
        Math.min(index, orderedShortReels.length - 1)
      );
      const targetReel = orderedShortReels[safeIndex];
      lockedReelIdsRef.current = orderedShortReels.map((r) =>
        String(r._id || r.id)
      );
      setSwipeDeltaY(0);
      setActiveReelIndex(safeIndex);
      reelWatchStartRef.current = Date.now();

      if (targetReel?._id) {
        setReelMetrics((prev) => {
          const current = prev[targetReel._id] || {
            views: 0,
            watchSeconds: 0,
            completionRate: 0.5,
          };
          return {
            ...prev,
            [targetReel._id]: { ...current, views: current.views + 1 },
          };
        });
      }
    },
    [orderedShortReels, pauseAllExcept]
  );

  const closeReelViewer = useCallback(() => {
    if (activeReelIndex !== null && orderedShortReels[activeReelIndex]) {
      recordReelWatchProgress(
        orderedShortReels[activeReelIndex],
        reelVideoRef.current
      );
    }
    reelWatchStartRef.current = null;
    lockedReelIdsRef.current = null;
    setSwipeDeltaY(0);
    setActiveReelIndex(null);
  }, [activeReelIndex, orderedShortReels, recordReelWatchProgress]);

  const stepReel = useCallback(
    (delta) => {
      if (activeReelIndex === null || !orderedShortReels.length) return;
      const nextIdx = activeReelIndex + delta;
      if (nextIdx < 0 || nextIdx >= orderedShortReels.length) return;
      recordReelWatchProgress(
        orderedShortReels[activeReelIndex],
        reelVideoRef.current
      );
      openReelAtIndex(nextIdx);
    },
    [
      activeReelIndex,
      orderedShortReels,
      recordReelWatchProgress,
      openReelAtIndex,
    ]
  );

  const handleReelTouchStart = (e) => {
    if (!e.touches?.length || activeReelIndex === null) return;
    touchStartYRef.current = e.touches[0].clientY;
    setSwipeDeltaY(0);
  };

  const handleReelTouchMove = (e) => {
    if (touchStartYRef.current === null || !e.touches?.length) return;
    const dy = e.touches[0].clientY - touchStartYRef.current;
    const shellHeight =
      reelVideoRef.current?.parentElement?.clientHeight ||
      window.innerHeight ||
      700;
    const maxDrag = shellHeight * 0.85;
    setSwipeDeltaY(Math.max(-maxDrag, Math.min(maxDrag, dy)));
  };

  const handleReelTouchEnd = () => {
    if (touchStartYRef.current === null || activeReelIndex === null) return;
    const shellHeight =
      reelVideoRef.current?.parentElement?.clientHeight ||
      window.innerHeight ||
      700;
    const threshold = Math.min(90, shellHeight * 0.16);

    if (
      swipeDeltaY < -threshold &&
      activeReelIndex < orderedShortReels.length - 1
    ) {
      stepReel(1);
    } else if (swipeDeltaY > threshold && activeReelIndex > 0) {
      stepReel(-1);
    } else {
      setSwipeDeltaY(0);
    }

    touchStartYRef.current = null;
  };

  const activeReel =
    activeReelIndex !== null && orderedShortReels[activeReelIndex]
      ? orderedShortReels[activeReelIndex]
      : null;
      return (
    <div className="newsfeed-container">
      {!isAuthenticated && (
        <div className="auth-notice-banner">
          <span>
            Post တင်ရန်၊ React / Comment ပေးရန် အကောင့်ဖြင့် Login ဝင်ရန်
            လိုအပ်ပါသည်။
          </span>
          {typeof setShowLogin === "function" && (
            <button
              type="button"
              className="auth-login-btn"
              onClick={() => setShowLogin(true)}
            >
              Login ဝင်မည်
            </button>
          )}
        </div>
      )}

      <form className="create-post-card" onSubmit={handleCreatePost}>
        <div className="create-post-header">
          <div className="avatar-badge">
            {(displayAuthor || "G").charAt(0).toUpperCase()}
          </div>
          <div className="author-meta">
            <strong>
              {isAuthenticated ? displayAuthor : "Guest (Login လိုအပ်သည်)"}
            </strong>
            <span>စိတ်ကူး၊ ဓာတ်ပုံ၊ ဗီဒီယို သို့မဟုတ် Short Reel မျှဝေပါ</span>
          </div>
        </div>

        <textarea
          className="post-textarea"
          rows={3}
          placeholder={
            isAuthenticated
              ? `${displayAuthor} ရေ... ဘာတွေ မျှဝေချင်လဲ?`
              : "Post တင်ရန် ဦးစွာ Login ဝင်ပါ..."
          }
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          disabled={isUploading || loading || !isAuthenticated}
        />

        {mediaPreview && (
          <div className="media-preview-box">
            {mediaType === "video" ? (
              <video src={mediaPreview} controls className="preview-video" />
            ) : (
              <img src={mediaPreview} alt="Preview" className="preview-image" />
            )}
            <button
              type="button"
              className="remove-media-btn"
              aria-label="Remove selected media"
              onClick={clearSelectedMedia}
              disabled={isUploading || loading}
            >
              ✕
            </button>
          </div>
        )}

        {mediaType === "video" && mediaPreview && (
          <label className="reel-toggle-label">
            <input
              type="checkbox"
              checked={isReelPost}
              onChange={(e) => setIsReelPost(e.target.checked)}
              disabled={isUploading || loading}
            />
            <span>🎬 Short Video Reel အဖြစ်လည်း ပြသမည်</span>
          </label>
        )}

        {(isUploading || loading) && (
          <div className="upload-mb-panel">
            <div className="upload-mb-row">
              <span>
                စုစုပေါင်း: <strong>{activeUpload?.totalMB ?? 0} MB</strong>
              </span>
              <span>
                တင်ပြီး: <strong>{activeUpload?.uploadedMB ?? 0} MB</strong>
              </span>
              <span>
                လိုသေး: <strong>{activeUpload?.remainingMB ?? 0} MB</strong>
              </span>
            </div>
            <button
              type="button"
              className="cancel-upload-btn"
              onClick={handleCancelUpload}
            >
              ⏹ တင်နေခြင်းကို ရပ်မည်
            </button>
          </div>
        )}

        <div className="create-post-actions">
          <label className="media-upload-btn">
            <span>📷 / 🎬 Photo or Video</span>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                handleMediaChange(e);
                e.target.value = "";
              }}
              hidden
              disabled={isUploading || loading || !isAuthenticated}
            />
          </label>

          <button
            type="submit"
            className="submit-post-btn"
            disabled={loading || isUploading || !isAuthenticated}
          >
            {isUploading || loading ? "တင်နေသည်..." : "Post တင်မည်"}
          </button>
        </div>
      </form>

      <div className="feed-toolbar">
        <span className="feed-title">IBRIDGE Newsfeed</span>
        <div className="sort-buttons">
          <button
            type="button"
            className={sortMode === "smart" ? "active" : ""}
            onClick={() => setSortMode("smart")}
          >
            ✨ For You
          </button>
          <button
            type="button"
            className={sortMode === "trending" ? "active" : ""}
            onClick={() => setSortMode("trending")}
          >
            🔥 Trending
          </button>
          <button
            type="button"
            className={sortMode === "latest" ? "active" : ""}
            onClick={() => setSortMode("latest")}
          >
            🕒 အသစ်ဆုံး
          </button>
        </div>
      </div>

      {shortReels.length > 0 && (
        <section className="reels-shelf-section" aria-label="Short Video Reels">
          <div className="reels-shelf-header">
            <h3>🎬 Short Reels</h3>
            <button
              type="button"
              className="reels-open-btn"
              onClick={() => openReelAtIndex(0)}
            >
              အကုန်ကြည့်မည် ({shortReels.length})
            </button>
          </div>
          <div className="reels-strip">
            {shortReels.slice(0, 8).map((reel, idx) => {
              const src =
                reel.image && !reel.isPosting
                  ? `${url}/api/post/stream/${reel.image}`
                  : reel.tempMediaUrl;
              return (
                <button
                  key={reel._id || idx}
                  type="button"
                  className="reel-thumb-card"
                  onClick={() => openReelAtIndex(idx)}
                >
                  {src && (
                    <video
                      src={src}
                      muted
                      playsInline
                      preload="metadata"
                      className="reel-thumb-video"
                    />
                  )}
                  <div className="reel-thumb-overlay">
                    <span className="reel-badge">▶ Reel</span>
                    <p className="reel-thumb-caption">
                      {reel.content || reel.author || "Short Video"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {fetchingPosts ? (
        <div className="feed-status">Post များ ဆွဲယူနေပါသည်...</div>
      ) : rankedPosts.length === 0 ? (
        <div className="feed-status">
          Post များ မရှိသေးပါ။ ပထမဆုံး Post တင်လိုက်ပါ!
        </div>
      ) : (
        <div className="posts-list">
          {rankedPosts.map((post) => {
            const isVideo = isVideoMedia(post);
            const mediaSrc =
              post.image && !post.isPosting
                ? isVideo
                  ? `${url}/api/post/stream/${post.image}`
                  : `${url}/images/${post.image}`
                : post.tempMediaUrl || null;

            const reactions = Array.isArray(post.reactions)
              ? post.reactions
              : [];
            const comments = Array.isArray(post.comments) ? post.comments : [];
            const sharesCount = Number(post.sharesCount || post.shares || 0);
            const isSaved = savedPostIds.has(String(post._id));

            const myReaction =
              isAuthenticated && currentUserId
                ? reactions.find(
                    (r) => String(r.userId) === String(currentUserId)
                  )
                : null;
            const myReactionMeta = myReaction
              ? REACTION_META[myReaction.type] || REACTION_META.like
              : null;

            const uniqueReactionTypes = Array.from(
              new Set(reactions.map((r) => r.type || "like"))
            ).slice(0, 4);

            const canDelete =
              isAuthenticated &&
              !post.isPosting &&
              post.userId &&
              currentUserId &&
              String(post.userId) === String(currentUserId);

            return (
              <article
                key={post._id}
                className={`post-card ${post.isPosting ? "is-posting" : ""}`}
              >
                <div className="post-header">
                  <div className="avatar-badge">
                    {(post.author || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="post-meta">
                    <strong>{post.author || "IBRIDGE Member"}</strong>
                    <small>
                      {post.isPosting
                        ? "တင်နေဆဲ..."
                        : formatRelativeTime(post.createdAt)}
                    </small>
                  </div>

                  <div className="post-header-actions">
                    <button
                      type="button"
                      className={`save-post-btn ${isSaved ? "saved" : ""}`}
                      onClick={() => handleToggleSavePost(post._id)}
                      title={isSaved ? "Saved မှ ဖြုတ်ရန်" : "Post သိမ်းရန်"}
                      aria-label={isSaved ? "Unsave post" : "Save post"}
                    >
                      {isSaved ? "🔖" : "📑"}
                    </button>

                    <button
                      type="button"
                      className="hide-post-btn"
                      onClick={() => handleHidePost(post)}
                      title="ဒီ Post ကို ဖျောက်ရန်"
                      aria-label="Hide post"
                    >
                      ✕
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        className="delete-post-btn"
                        onClick={() => handleDeletePost(post._id)}
                        title="Post ဖျက်ရန်"
                        aria-label="Post ဖျက်ရန်"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>

                {post.content && <p className="post-content">{post.content}</p>}

                {mediaSrc && (
                  <div className="post-media-container">
                    {isVideo ? (
                      <>
                        <video
                          ref={(el) => registerVideoRef(post._id, el)}
                          src={mediaSrc}
                          controls
                          preload="metadata"
                          playsInline
                          onPlay={() => handleVideoPlay(post._id)}
                          className="post-video-player"
                        />
                        {shortReels.some((r) => r._id === post._id) && (
                          <button
                            type="button"
                            className="open-in-reel-btn"
                            onClick={() => {
                              const idx = orderedShortReels.findIndex(
                                (r) => r._id === post._id
                              );
                              if (idx !== -1) openReelAtIndex(idx);
                            }}
                          >
                            🎬 Reel Mode ဖြင့် ကြည့်ရန်
                          </button>
                        )}
                      </>
                    ) : (
                      <img
                        src={mediaSrc}
                        alt="Post media"
                        loading="lazy"
                        className="post-image"
                      />
                    )}
                  </div>
                )}

                <div className="post-stats">
                  <div className="reaction-summary">
                    {reactions.length > 0 && (
                      <>
                        <span className="reaction-icons">
                          {uniqueReactionTypes.map((type) => (
                            <span key={type}>
                              {REACTION_META[type]?.emoji || "👍"}
                            </span>
                          ))}
                        </span>
                        <span>{reactions.length}</span>
                      </>
                    )}
                  </div>
                  <div className="post-engagement-counts">
                    <button
                      type="button"
                      className="comment-count-btn"
                      onClick={() =>
                        setOpenCommentBoxId((prev) =>
                          prev === post._id ? null : post._id
                        )
                      }
                    >
                      {comments.length} Comment
                    </button>
                    {sharesCount > 0 && (
                      <span className="share-count-label">
                        {sharesCount} Share
                      </span>
                    )}
                  </div>
                </div>

                <div className="post-actions-bar">
                  <div
                    className="reaction-wrapper"
                    onMouseEnter={() => openPickerForPost(post._id)}
                    onMouseLeave={scheduleClosePicker}
                  >
                    {openReactionPickerId === post._id && (
                      <div className="reaction-picker">
                        {REACTION_KEYS.map((key) => {
                          const item = REACTION_META[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              className="reaction-choice"
                              title={item.label}
                              aria-label={item.label}
                              onClick={() => handleReact(post._id, key)}
                            >
                              {item.emoji}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      className={`action-btn ${myReaction ? "reacted" : ""}`}
                      style={
                        myReactionMeta
                          ? { color: myReactionMeta.color }
                          : undefined
                      }
                      onClick={() =>
                        handleReact(post._id, myReaction?.type || "like")
                      }
                    >
                      <span>{myReactionMeta ? myReactionMeta.emoji : "👍"}</span>
                      <span>
                        {myReactionMeta ? myReactionMeta.label : "Like"}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="action-btn"
                    onClick={() =>
                      setOpenCommentBoxId((prev) =>
                        prev === post._id ? null : post._id
                      )
                    }
                  >
                    <span>💬</span>
                    <span>Comment</span>
                  </button>

                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => handleSharePost(post)}
                  >
                    <span>↗</span>
                    <span>Share</span>
                  </button>
                </div>

                {openCommentBoxId === post._id && (
                  <div className="comments-section">
                    <form
                      className="comment-form"
                      onSubmit={(e) => handleAddComment(e, post._id)}
                    >
                      <input
                        type="text"
                        placeholder={
                          isAuthenticated
                            ? "Comment တစ်ခု ရေးပါ..."
                            : "Comment ရေးရန် Login ဝင်ပါ..."
                        }
                        value={commentInputs[post._id] || ""}
                        disabled={!isAuthenticated}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post._id]: e.target.value,
                          }))
                        }
                      />
                      <button type="submit" disabled={!isAuthenticated}>
                        ပို့မည်
                      </button>
                    </form>

                    <div className="comments-list">
                      {comments.map((cmt, idx) => (
                        <div
                          key={cmt._id || `${post._id}-cmt-${idx}`}
                          className="comment-item"
                        >
                          <strong>{cmt.user || cmt.userName || "User"}</strong>
                          <p>{cmt.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {activeReel && (
        <div
          className="reel-viewer-modal"
          role="dialog"
          aria-modal="true"
          onClick={closeReelViewer}
        >
          <div
            className="reel-player-shell"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleReelTouchStart}
            onTouchMove={handleReelTouchMove}
            onTouchEnd={handleReelTouchEnd}
          >
            <div className="reel-top-controls">
              <button
                type="button"
                className="reel-control-btn"
                onClick={() => setReelsMuted((m) => !m)}
              >
                {reelsMuted ? "🔇 Unmute" : "🔊 Sound"}
              </button>
              <span className="reel-counter">
                {(activeReelIndex ?? 0) + 1} / {orderedShortReels.length}
              </span>
              <button
                type="button"
                className="reel-control-btn reel-exit-btn"
                onClick={closeReelViewer}
                aria-label="Reel ထဲမှ ထွက်ရန်"
              >
                ✕ ထွက်မည်
              </button>
            </div>

            <div
              className="reel-vertical-track"
              style={{
                transform: `translate3d(0, calc(${
                  -(activeReelIndex ?? 0) * 100
                }% + ${swipeDeltaY}px), 0)`,
                transition:
                  swipeDeltaY === 0
                    ? "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)"
                    : "none",
              }}
            >
              {orderedShortReels.map((reelItem, idx) => {
                const isCurrent = idx === activeReelIndex;
                const shouldRenderVideo =
                  Math.abs(idx - (activeReelIndex ?? 0)) <= 1;
                const reelSrc =
                  reelItem.image && !reelItem.isPosting
                    ? `${url}/api/post/stream/${reelItem.image}`
                    : reelItem.tempMediaUrl;

                return (
                  <div key={reelItem._id || idx} className="reel-track-slide">
                    {shouldRenderVideo && reelSrc ? (
                      <video
                        ref={isCurrent ? reelVideoRef : null}
                        src={reelSrc}
                        autoPlay={isCurrent}
                        loop
                        playsInline
                        preload={isCurrent ? "auto" : "metadata"}
                        muted={!isCurrent || reelsMuted}
                        onPlay={() => {
                          if (isCurrent && reelVideoRef.current?.paused) {
                            reelVideoRef.current.play().catch(() => {});
                          }
                        }}
                        onEnded={() => {
                          if (isCurrent) {
                            recordReelWatchProgress(
                              reelItem,
                              reelVideoRef.current
                            );
                          }
                        }}
                        className="reel-full-video"
                      />
                    ) : (
                      <div className="reel-slide-placeholder" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="reel-side-actions">
              <button
                type="button"
                className="reel-action-circle"
                onClick={() => handleReact(activeReel._id, "like")}
              >
                <span>👍</span>
                <small>
                  {Array.isArray(activeReel.reactions)
                    ? activeReel.reactions.length
                    : 0}
                </small>
              </button>

              <button
                type="button"
                className="reel-action-circle"
                onClick={() => handleSharePost(activeReel)}
              >
                <span>↗</span>
                <small>Share</small>
              </button>

              <button
                type="button"
                className="reel-action-circle"
                onClick={() => stepReel(-1)}
                disabled={activeReelIndex <= 0}
                title="Previous Reel"
                aria-label="Previous Reel"
              >
                ▲
              </button>

              <button
                type="button"
                className="reel-action-circle"
                onClick={() => stepReel(1)}
                disabled={activeReelIndex >= orderedShortReels.length - 1}
                title="Next Reel"
                aria-label="Next Reel"
              >
                ▼
              </button>
            </div>

            <div className="reel-bottom-meta">
              <strong>@{activeReel.author || "IBRIDGE Member"}</strong>
              {activeReel.content && <p>{activeReel.content}</p>}
              <span className="reel-swipe-hint">
                ↑ အပေါ်ဆွဲ = နောက်တစ်ပုဒ် · ↓ အောက်ဆွဲ = အရင်တစ်ပုဒ်
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Newsfeed;