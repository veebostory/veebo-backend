"use strict";
const mongoose = require("mongoose");
const contact = new mongoose.Schema(
  {
    email: {
      type: String,
    },
    name: {
      type: String,
    },
    subject:{
      type:String,
    },
    message:{
      type:String
    }
  },
  {
    timestamps: true,
  }
);

contact.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Contact", contact);
