"use strict";

const mongoose = require("mongoose");
//const { uniq, unique } = require("underscore");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    educational_department: {
      type: String,
    },
    school_name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    type: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    user_type: {
      type: String,
    },
    paymentid: {
      type: String,
    },
    expire: {
      type: Date,
    },
    plantype: {
      type: String,
    },
    subscriptionplan: {
      type: Object
    },
    write: {
      type: Number,
    },
    read: {
      type: Number,
    },
    devices: [{ token: { type: String }, date: { type: Date } }],
  },
  {
    timestamps: true,
  }
);
userSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

userSchema.methods.encryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};
userSchema.methods.isValidPassword = function isValidPassword(password) {
  return bcrypt.compareSync(password, this.password);
};
module.exports = mongoose.model("User", userSchema);
