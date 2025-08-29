const response = require("../responses");
const mongoose = require("mongoose");
const subscription = mongoose.model("subscription");

module.exports = {

    create: async (req, res) => {
        try {
            const payload = {
                ...req.body
            }
            // console.log(payload);
            let faq = new subscription(payload);
            await faq.save();
            return response.ok(res, { message: "Subscription Created", faq });
        } catch (error) {
            console.log(error);
            return response.error(res, error);
        }
    },

    delete: async (req, res) => {
        try {

            await subscription.findByIdAndDelete(req.params.id);
            return response.ok(res, { message: "Subscription Deleted" });
        } catch (error) {
            console.log(error);
            return response.error(res, error);
        }
    },

    update: async (req, res) => {
        try {
            console.log(req.params)
            await subscription.findByIdAndUpdate(req.params.id, req.body);
            return response.ok(res, { message: "Subscription updated" });
        } catch (error) {
            mi
            console.log(error);
            return response.error(res, error);
        }
    },
    getFAQ: async (req, res) => {
        try {
            const data = await subscription.find().sort({ 'period': 1 })
            return response.ok(res, data);
        } catch (error) {
            return response.error(res, error);
        }
    }
}