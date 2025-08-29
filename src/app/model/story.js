"use strict";

const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    storyname: {
      type: String,
    },
    image: {
      type: String,
    },
    story: {
      type: String,
    },
    plainstory: {
      type: String,
    },
    instructions: {
      type: String,
    },
    writer: {
      type: String,
    },
    active: {
      type: Boolean,
      default: false,
    },
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    view: {
      type: Number,
    },
    favourite: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("STORY", storySchema);
