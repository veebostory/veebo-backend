"use strict";

const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      storyid:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "STORY",
      },
      rating:{
        type:Number,
        
      }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Rating", ratingSchema);
