const mongoose = require("mongoose");
const { supportmail } = require("../services/mailNotification");
const Contact = mongoose.model("Contact");
module.exports = {
  postcontact: async (req, res) => {
    try {
      const data = req.body;
      const newContact = new Contact(data);
      const response = await newContact.save();
      console.log("data saved");
      await supportmail(data)
      res.status(200).json(response);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getallcontact: async (req, res) => {
    try {
      const data = await Contact.find().sort({ 'createdAt': -1 });
      console.log('data fetched');
      res.status(200).json(data);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  deletecontact: async (req, res) => {
    try {
      const BasicdataId = req.params.id;
      const response = await Contact.findByIdAndDelete(BasicdataId);
      if (!response) {
        return res.status(404).json({ error: "Person not found" });
      }
      console.log("data updated");
      res.status(200).json(response);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
}