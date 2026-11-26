import postModel from "../models/postModel.js";
import fs from "fs";
import path from "path";

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov|m4v|avi|mkv)$/i;

const getAllPosts = async (req, res) => {
  try {
    const posts = await postModel.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, data: posts });
  } catch (error) {
    console.error("getAllPosts error:", error);
    return res.json({ success: false, message: "Error fetching posts" });
  }
};

const createPost = async (req, res) => {
  try {
    const body = req.body || {};
    const textContent = (body.content || "").trim();
    const hasFile = Boolean(req.file);

    if (!textContent && !hasFile) {
      return res.json({
        success: false,
        message: "စာသား၊ ဓာတ်ပုံ သို့မဟုတ် ဗီဒီယို တစ်ခုခု ထည့်ပေးပါ",
      });
    }

    const filename = hasFile ? req.file.filename : "";
    const isVideo =
      hasFile &&
      (req.file.mimetype?.startsWith("video/") ||
        VIDEO_EXT_REGEX.test(req.file.originalname || filename));

    const newPost = new postModel({
      author: (body.author || "").trim() || "IBRIDGE Member",
      userId: body.userId || "",
      content: body.content || "",
      image: filename,
      mediaType: hasFile ? (isVideo ? "video" : "image") : "image",
    });

    await newPost.save();
    return res.json({
      success: true,
      message: "Post တင်ပြီးပါပြီ",
      data: newPost,
    });
  } catch (error) {
    console.error("createPost error:", error);
    return res.json({ success: false, message: "Post တင်မရပါ" });
  }
};

// Facebook Reaction မျိုးစုံ (Like, Love, Haha, Wow)
const reactPost = async (req, res) => {
  try {
    const { postId, userId, type } = req.body || {};
    if (!postId || !userId || !type) {
      return res.json({ success: false, message: "Invalid reaction data" });
    }

    const post = await postModel.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post မတွေ့ပါ" });
    }

    const existingIndex = post.reactions.findIndex((r) => r.userId === userId);
    if (existingIndex !== -1) {
      if (post.reactions[existingIndex].type === type) {
        post.reactions.splice(existingIndex, 1);
      } else {
        post.reactions[existingIndex].type = type;
      }
    } else {
      post.reactions.push({ userId, type });
    }

    await post.save();
    return res.json({ success: true, reactions: post.reactions });
  } catch (error) {
    console.error("reactPost error:", error);
    return res.json({ success: false, message: "Reaction error" });
  }
};

const addComment = async (req, res) => {
  try {
    const { postId, user, text } = req.body || {};
    const cleanText = (text || "").trim();

    if (!postId || !cleanText) {
      return res.json({ success: false, message: "Comment စာသား ထည့်ပေးပါ" });
    }

    const post = await postModel.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post မတွေ့ပါ" });
    }

    post.comments.push({ user: user || "User", text: cleanText });
    await post.save();
    return res.json({ success: true, comments: post.comments });
  } catch (error) {
    console.error("addComment error:", error);
    return res.json({ success: false, message: "Error commenting" });
  }
};

// Post ဖျက်ခြင်း (ဖိုင်ပါ တစ်ခါတည်း ဖျက်ပေးမည်)
const deletePost = async (req, res) => {
  try {
    const { postId } = req.body || {};
    if (!postId) {
      return res.json({ success: false, message: "Post ID လိုအပ်ပါသည်" });
    }

    const post = await postModel.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post မတွေ့ပါ" });
    }

    if (post.image) {
      const safeName = path.basename(post.image);
      const filePath = path.join("uploads", safeName);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Media delete error:", err);
        }
      });
    }

    await postModel.findByIdAndDelete(postId);
    return res.json({ success: true, message: "Post ဖျက်ပြီးပါပြီ" });
  } catch (error) {
    console.error("deletePost error:", error);
    return res.json({ success: false, message: "Post ဖျက်မရပါ" });
  }
};

export { getAllPosts, createPost, reactPost, addComment, deletePost };