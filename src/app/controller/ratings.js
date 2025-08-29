const mongoose = require("mongoose");
const responseg = require("./../responses");
const Rating = mongoose.model("Rating");
module.exports = {
  postrating: async (req, res) => {
    try {
      const response = await Rating.findOne({ user: req.user.id ,storyid: req.params.id});
      // console.log('1',response)
      // response.map(()=>)
      if (response) {
        const newresponse = await Rating.findByIdAndUpdate(
          response._id,
          { rating: req.body.rating },
          { new: true, upsert: true }
        );
        console.log("data updated");
        return responseg.ok(res, { message: "Rate Succesfully", newresponse });
      } else {
        const newService = new Rating({
          user: req.user.id,
          storyid: req.params.id,
          rating: req.body.rating,
        });
        const newresponse = await newService.save();
        console.log("data saved");
        return responseg.ok(res, { message: "Rate Succesfully", newresponse });
      }

      // res.status(200).json(response);
    } catch (err) {
      console.log(err);
      return responseg.error(res, err);
      // res.status(500).json({error:'Internal Server Error'});
    }
  },
};
