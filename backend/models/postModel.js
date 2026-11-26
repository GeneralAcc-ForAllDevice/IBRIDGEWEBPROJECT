import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true, default: "User" },
    userId: { type: String, default: "" },
    content: { type: String, default: "" },
    image: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video", "text"], default: "image" },
    reactions: [
      {
        userId: { type: String, required: true },
        type: {
          type: String,
          enum: ["like", "love", "haha", "wow"],
          default: "like",
        },
      },
    ],
    comments: [
      {
        user: { type: String, default: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

const postModel = mongoose.models.post || mongoose.model("post", postSchema);
export default postModel;