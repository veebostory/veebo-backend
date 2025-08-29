"use strict";

const mongoose = require("mongoose");

const ipSchema = new mongoose.Schema(
  {
    ip:{
        type:String
    },
    localip:{
        type:String
    },
    trial:{
        type:Boolean,
        default:false
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("IP", ipSchema);
