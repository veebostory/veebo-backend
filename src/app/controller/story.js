const { default: axios } = require("axios");
const mongoose = require("mongoose");
const STORY = mongoose.model("STORY");
const Rating = mongoose.model("Rating");
const User = mongoose.model("User");
const IP = mongoose.model("IP");
const response = require("./../responses");
const { Configuration, OpenAI } = require("openai");
const { putS3Object } = require("../services/urlToUplod");
const { uploadFromUrl } = require("../services/fileUpload");
const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});
// const axios = require('axios');
// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);
module.exports = {
  oldgenerate_story: async (req, res) => {
    const serviceid2 = await User.findById(req.user.id);
    if (serviceid2.write === 0 || serviceid2.paymentid) {
      console.log(serviceid2)
      let image_type;
      if (serviceid2.subscriptionplan && serviceid2.subscriptionplan.device !== 1) {
        image_type = 'colorfull'
      } else {
        image_type = 'black and white'
      }
      const payload = req.body;
      const instructions = `please help me to create a story for me which include name of the character${req.body.character} and the nature of my character is ${req.body.charactertype} and the type of my story is like ${req.body.storytype} and name of my story is ${req.body.storyname} and my name is ${req.body.writer}.`;
      try {
        const storyCompletion = await openai.completions.create({
          model: "gpt-3.5-turbo-instruct", // You can use other models like "gpt-3.5-turbo" or "gpt-4"
          prompt: `${instructions}.This story should not include any sexual and violent content`,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
        const imageCompletion = await openai.images.generate({
          prompt: `${instructions} please create animated image and it should be ${image_type}.`,
          n: 1,
          size: "1024x1024",
        });
        const Imgurl = imageCompletion.data[0].url
        console.log(Imgurl)
        const result = await uploadFromUrl(Imgurl)
        const data = {
          story: storyCompletion.choices[0],
          image: result.secure_url,
          title: payload?.storyname,
        };
        const newStory = new STORY({
          user: payload?.id,
          storyname: payload?.storyname,
          image: data.image,
          writer: req.body.writer,
          story: `<p style="margin-top:10px;">${data.story.text.replace(/\n/g, '</p><p style="margin-top:10px;">')}</p>`,
          plainstory: data.story.text,
          instructions: instructions,
          view: 0,
        });
        await newStory.save();
        const serviceid = await User.findById(req.user.id);
        serviceid.write = Number(serviceid?.write || 0) + 1;
        await serviceid.save();
        const ip = await IP.findOneAndUpdate({ localip: req.body.localip }, { trial: true });

        return res
          .status(200)
          .json({ success: true, data, storyid: newStory._id });
      } catch (error) {
        console.error("Error generating story:", error);
        return res.status(500).send(error);
      }
    } else {
      return response.badReq(res, {
        message: "Please Subscribe to read more storys",
      });
    }
  },

  generate_story: async (req, res) => {
    const serviceid2 = await User.findById(req.user.id);
    if (serviceid2.write === 0 || serviceid2.paymentid) {
      console.log(serviceid2)
      let image_type;
      if (serviceid2.subscriptionplan && serviceid2.subscriptionplan.device !== 1) {
        image_type = 'colorfull'
      } else {
        image_type = 'black and white'
      }
      const payload = req.body;
      const instructions = `please help me to create a story for me which include name of the character${req.body.character} and the nature of my character is ${req.body.charactertype} and the type of my story is like ${req.body.storytype} and name of my story is ${req.body.storyname} and my name is ${req.body.writer}.`;
      try {
        // const storyCompletion = await openai.completions.create({
        //   model: "gpt-3.5-turbo-instruct", // You can use other models like "gpt-3.5-turbo" or "gpt-4"
        //   prompt: `${instructions}.This story should not include any sexual and violent content`,
        //   temperature: 0.7,
        //   max_tokens: 1000,
        //   top_p: 1,
        //   frequency_penalty: 0,
        //   presence_penalty: 0,
        // });

        console.log('AAAAAA', instructions);

        const new_story = await axios.post('https://api.1min.ai/api/features', {
          "type": "CONTENT_GENERATOR_BLOG_ARTICLE",
          "model": "gpt-3.5-turbo",
          "conversationId": "CONTENT_GENERATOR_BLOG_ARTICLE",
          "promptObject": {
            "language": "English",
            "tone": "informative",
            "numberOfWord": 1000,
            "numberOfSection": 1,
            "keywords": "computer",
            "prompt": `${instructions}.This story should not include any sexual and violent content`,
          }
        },
          {
            headers: {
              'API-KEY': process.env["MIN_AI_APIKEY"],
              'Content-Type': 'application/json'
            }
          }
        );

        const story_img = await axios.post('https://api.1min.ai/api/features', {
          "type": "IMAGE_GENERATOR",
          "Content-Type": "application/json",
          "model": "5c232a9e-9061-4777-980a-ddc8e65647c6",
          "promptObject": {
            "prompt": `${instructions} please create animated image and it should be ${image_type}.`,
            "size": "1024x1024",
            "n": 1
          }
        },
          {
            headers: {
              'API-KEY': process.env["MIN_AI_APIKEY"],
              'Content-Type': 'application/json'
            }
          }
        );



        // return res
        //   .status(200)
        //   .json({ success: true, data: story_img.data });

        // const imageCompletion = await openai.images.generate({
        //   prompt: `${instructions} please create animated image and it should be ${image_type}.`,
        //   n: 1,
        //   size: "1024x1024",
        // });
        const Imgurl = story_img.data.aiRecord.temporaryUrl
        console.log(Imgurl)
        const result = await uploadFromUrl(Imgurl)
        const data = {
          story: new_story.data.aiRecord.aiRecordDetail.resultObject[0],
          image: result.secure_url,
          title: payload?.storyname,
        };
        const newStory = new STORY({
          user: payload?.id,
          storyname: payload?.storyname,
          image: data.image,
          writer: req.body.writer,
          story: `<p style="margin-top:10px;">${data.story.replace(/\n/g, '</p><p style="margin-top:10px;">')}</p>`,
          plainstory: data.story,
          instructions: instructions,
          view: 0,
        });
        await newStory.save();
        const serviceid = await User.findById(req.user.id);
        serviceid.write = Number(serviceid?.write || 0) + 1;
        await serviceid.save();
        const ip = await IP.findOneAndUpdate({ localip: req.body.localip }, { trial: true });

        return res
          .status(200)
          .json({ success: true, data, storyid: newStory._id });
      } catch (error) {
        console.error("Error generating story:", error);
        return res.status(500).send(error);
      }
    } else {
      return response.badReq(res, {
        message: "Please Subscribe to read more storys",
      });
    }
  },

  getallstory: async (req, res) => {
    try {
      const data = await STORY.find({ active: true }).sort({ createdAt: -1 });
      console.log("data fetched");
      res.status(200).json(data);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getstory: async (req, res) => {
    try {
      const serviceid2 = await User.findById(req.user.id);
      // if (serviceid2.read === 0 || serviceid2.paymentid || serviceid2.write === 0) {
      const ratebu = await Rating.findOne({
        user: req.user.id,
        storyid: req.params.id,
      });
      console.log("ratebu", serviceid2);
      const ratebs = await Rating.find({ storyid: req.params.id });
      console.log("ratebs", ratebs);
      let avg = 0;
      if (ratebs) {

        const sum = ratebs.reduce(
          (accumulator, currentValue) => accumulator + currentValue.rating,
          0
        );
        console.log("sum", sum);
        avg = sum / ratebs.length;
        console.log("avg", avg);
      }


      const serviceid = await STORY.findById(req?.params?.id);
      console.log("data fetched", req.user);
      if (serviceid.active && serviceid.user.toString() !== req.user.id) {
        serviceid.view = Number(serviceid.view || 0) + 1;
        await serviceid.save();
      }
      // const serviceid2 = await User.findById(req.user.id);
      serviceid2.read = Number(serviceid2.read || 0) + 1;
      await serviceid2.save();

      //  const newrating2= ratebs.find((item)=>{
      //     if (item.user==req?.params?.id) {
      //       return(item.rating)
      //     }
      //   })
      // const newrating= ratebs.find((item)=>{
      //   if (item.user==req.user.id) {
      //     return(item.rating)
      //   }
      // })
      // console.log(newrating)
      // const rate=newrating?newrating.rating:null
      res
        .status(200)
        .json({ serviceid, rating: ratebu?.rating || 0, avg: avg });
      // if (ratebu) {

      //   res.status(200).json({ serviceid, rating: ratebu.rating, avg: avg });
      // } else {
      //   res.status(200).json({ serviceid});

      // }
      // } else {
      //   return response.badReq(res, {
      //     message: "Please Subscribe to read more storys",
      //   });
      // }
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getstorybyuser: async (req, res) => {
    try {
      const serviceid = await STORY.find({ user: req?.params?.id, active: true }).sort({ createdAt: -1 });
      console.log("data fetched");
      res.status(200).json(serviceid);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  updatepstory: async (req, res) => {
    try {
      const BasicdataId = req.params.id;
      const BasicdataData = req.body;
      const response = await STORY.findById(BasicdataId);
      if (!response) {
        return res.status(404).json({ error: "Service not found" });
      }
      console.log("data updated");
      response.active = true;
      await response.save();
      res.status(200).json(response);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  deletestory: async (req, res) => {
    try {
      const BasicdataId = req.params.id;
      const response = await STORY.findByIdAndDelete(BasicdataId);
      if (!response) {
        return res.status(404).json({ error: "Story not found" });
      }
      console.log("data updated");
      res.status(200).json(response);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  likeplus: async (req, res) => {
    try {
      const BasicdataId = req.params.id;
      const response = await STORY.findById(BasicdataId);
      // console.log(response)
      // response.like=[req.body.id]
      // await response.save()
      // res.status(200).json(response);
      if (!response) {
        return res.status(404).json({ error: "Story not found" });
      } else {
        console.log("got story");
        let findlike;
        if (response.like.length > 0) {
          findlike = await STORY.findOne({ like: { $in: [req.user.id] } });
        }
        console.log(findlike);
        if (!findlike) {
          console.log("not like");
          const responsedata = await STORY.findByIdAndUpdate(
            BasicdataId,
            {
              $push: { like: req.user.id },
            },
            { new: true, upsert: true }
          );
          console.log("data updated");
          res.status(200).json(responsedata);
        } else {
          console.log("got like");
          const resdata = await STORY.findByIdAndUpdate(BasicdataId, {
            $pull: { like: req.user.id },
          });
          console.log("data updated");
          const response2 = await STORY.findById(BasicdataId);
          res.status(200).json(response2);
        }
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  favouriteplus: async (req, res) => {
    try {
      const BasicdataId = req.params.id;
      const response = await STORY.findById(BasicdataId);
      // console.log(response)
      // response.like=[req.user.id]
      // await response.save()
      // res.status(200).json(response);
      if (!response) {
        return res.status(404).json({ error: "Story not found" });
      } else {
        console.log("got story");
        let findfavourite;
        if (response.favourite.length > 0) {
          findfavourite = await STORY.findOne({
            favourite: { $in: [req.user.id] },
          });
        }
        console.log(findfavourite);
        if (!findfavourite) {
          console.log("not favourite");
          const responsedata = await STORY.findByIdAndUpdate(
            BasicdataId,
            {
              $push: { favourite: req.user.id },
            },
            { new: true, upsert: true }
          );
          console.log("data updated");
          res.status(200).json(responsedata);
        } else {
          console.log("got favourite");
          const resdata = await STORY.findByIdAndUpdate(BasicdataId, {
            $pull: { favourite: req.user.id },
          });
          console.log("data updated");
          const response2 = await STORY.findById(BasicdataId);
          res.status(200).json(response2);
        }
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};
