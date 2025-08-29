"use strict";

const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    plantype: {
      type: String
    },
    price: {
      type: String
    },
    currency: {
      type: String
    },
    month: {
      type: Number
    },
    is_best: {
      type: Boolean,
      default: false
    },
    device: {
      type: Number
    },
    extra_feature: [
      {
        type: Object
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PLAN", planSchema);
