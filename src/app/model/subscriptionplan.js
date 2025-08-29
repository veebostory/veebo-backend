"use strict";

const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        offer: {
            type: Number,
        },
        plan: {
            type: Number,
        },
        type: {
            type: String,
        },
        period: {
            type: Number,
        },
        currency: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.model("subscription", subscriptionSchema);
