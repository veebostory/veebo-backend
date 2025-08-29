"use strict";
const userHelper = require("./../helper/user");
const response = require("./../responses");
const passport = require("passport");
const jwtService = require("./../services/jwtService");
const mailNotification = require("./../services/mailNotification");
const mongoose = require("mongoose");

const User = mongoose.model("User");
const Device = mongoose.model("Device");
const Verification = mongoose.model("Verification");
const Notification = mongoose.model("Notification");
const IP = mongoose.model("IP");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const user = require("../model/user");
const { default: axios } = require("axios");
const { uploadFromUrl, putS3Object } = require("../services/urlToUplod");

module.exports = {
  postip: async (req, res) => {
    try {
      const data = req.body
      const ip = await IP.findOne({ localip: req.body.localip });
      if (ip) {
        if (ip.trial) {
          return response.badReq(res, { message: "You have already tried with another account" });
        }
        else {
          return response.ok(res);
        }
      } else {
        const newService = new IP(data);
        const newresponse = await newService.save();
        console.log('data saved');
        return response.ok(res, { message: "IP saved", newresponse });
      }
    } catch (err) {
      console.log(err);
      return response.error(res, err);
    }
  },
  cheakdevice: async (req, res) => {
    try {
      return response.ok(res);
    }
    catch (err) {
      console.log(err);
      return response.error(res, err);
    }
  },
  // login controller
  login: (req, res) => {
    console.log("request came here");
    passport.authenticate("local", async (err, user, info) => {
      if (err) {
        return response.error(res, err);
      }
      if (!user) {
        return response.unAuthorize(res, info);
      }
      // if (user.type === "USER") {
      //   if (user.userType !== req.body.userType) {
      //     return response.unAuthorize(res, { message: "unAuthorized" });
      //   }
      // }

      // if (user.tokenVersion === 0) {
      //   user.tokenVersion = 1
      // } else {
      user.tokenVersion = uuidv4();
      // }




      let token = await new jwtService().createJwtToken({
        id: user._id,
        // user: user.fullName,
        type: user.type,
        tokenVersion: new Date(),
      });
      await Device.updateOne(
        { device_token: req.body.device_token },
        { $set: { player_id: req.body.player_id, user: user._id } },
        { upsert: true }
      );

      if (user.subscriptionplan && user.subscriptionplan.device !== 0 && user.expire > new Date()) {
        console.log('=====>', user.devices.length, user.subscriptionplan.device)
        if (user.devices.length === user.subscriptionplan.device) {
          const olddate = user.devices.sort((a, b) => a.date - b.date)

          console.log('olddate', olddate)
          user.devices.pull(olddate[0])
          user.devices.push({ token: token, date: Date.now() });

        }
        else {
          user.devices.push({ token: token, date: Date.now() });

        }
      }
      else {

        user.devices = [{ token: token, date: Date.now() }]
      }
      // user.devices.push();
      // user.devices.date=Date.now()
      const data = {
        token,
        ...user._doc,
      };
      await user.save();

      delete data.password;
      return response.ok(res, { ...data });
    })(req, res);
  },

  register: async (req, res) => {
    try {
      const payload = req.body;
      const mail = req.body.email;
      if (!mail) {
        return response.badReq(res, { message: "Email required." });
      }
      let user2 = await User.findOne({
        email: payload.email.toLowerCase(),
      });
      //const user = await User.findOne({ phone });
      // if (user) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "Phone number already exists.",
      //   });
      // }
      if (user2) {
        return res.status(404).json({
          success: false,
          message: "Email Id already exists.",
        });
      } else {
        let user = new User({
          username: payload?.username,
          email: payload?.email,
          type: payload?.type,
          // educational_department: payload?.educational_department,
          // school_name: payload?.school_name,
          read: 0,
          write: 0,
          user_type: payload?.user_type
        });
        user.password = user.encryptPassword(req.body.password);
        await user.save();
        await mailNotification.welcomeMail({
          email: user.email,
          username: user.username,
        });
        res.status(200).json({ success: true, data: user });
      }
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateplaninuser: async (req, res) => {
    try {
      const newresponse = await User.findByIdAndUpdate(
        req.user.id,
        req.body,
        { new: true, upsert: true }
      );
      console.log("data updated");
      return response.ok(res, { message: "Rate Succesfully", newresponse });
    } catch { }
  },
  signUp: async (req, res) => {
    try {
      const payload = req.body;
      let user = await User.find({
        email: payload.email.toLowerCase(),
      }).lean();
      let verId = await userHelper.decode(payload.token);
      let ver = await Verification.findById(verId);

      if (!user.length) {
        // let user = await User.findOne({ email: payload.email.toLowerCase()  }).lean();
        // if (!user) {
        if (
          payload.otp == ver.otp &&
          !ver.verified &&
          new Date().getTime() < new Date(ver.expiration_at).getTime()
        ) {
          let user = new User({
            fullName: payload?.fullName,
            phone: payload?.phone,
            email: payload.email.toLowerCase(),
            address: payload?.address,
            password: payload.password,
            username: payload.username.toLowerCase(),
            type: payload.type,
            gender: payload.gender,
            institution: payload.institution,
          });
          user.password = user.encryptPassword(req.body.password);
          await user.save();
          mailNotification.welcomeMail({
            email: user.email,
            username: user.username,
          });
          // let token = await new jwtService().createJwtToken({ id: user._id, email: user.username });
          return response.created(res, { user: user });
        } else {
          return response.notFound(res, { message: "Invalid OTP" });
        }
      } else {
        return response.conflict(res, {
          message: "username or email already exists.",
        });
      }
    } catch (error) {
      return response.error(res, error);
    }
  },
  // signUp: async (req, res) => {
  //   try {
  //     const payload = req.body;
  //     console.log(payload);
  //     let ver = await Verification.findOne({ phone: payload.phone });
  //     console.log(ver)
  //     if(ver){
  //     if (payload.otp === ver.otp &&
  //       !ver.verified &&
  //       new Date().getTime() < new Date(ver.expiration_at).getTime()) {
  //       let user = await User.find({
  //         phone: payload.phone,
  //       });
  //       if (!user.length) {
  //         let user = new User({
  //                     name: payload?.name,
  //                     phone: payload?.phone,
  //                     code:payload?.code,
  //                     type:payload?.type
  //                   });
  //                   await user.save();
  //         await Verification.findOneAndDelete({ phone: payload.phone });
  //         res.status(200).json({ success: true, data: user });
  //       } else {
  //         res.status(404).json({
  //           success: false,
  //           message: "Phone number already exists.",
  //         });
  //       }
  //     } else {
  //       res.status(404).json({ success: false, message: "Invalid OTP" });
  //     }}
  //     else{
  //       res.status(404).json({ success: false, message: "Invalid OTP" });
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     return response.error(res, err);
  //   }
  // },
  getAllUsers: async (req, res) => {
    try {
      const user = await User.find();
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },
  deleteuser: async (req, res) => {
    try {
      const UserId = req.params.id;
      const response = await User.findByIdAndDelete(UserId);
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
  getuserbyid: async (req, res) => {
    try {
      // const event = req.params.id;
      const serviceid = await User.findById(req.user.id);
      console.log("data fetched");
      res.status(200).json(serviceid);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  delUsers: async (req, res) => {
    try {
      console.log("req.body.id", req.body.id);
      const user = await User.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.body.id) },
        { isDeleted: true }
      );
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },
  // createGetInTouch: async (req, res) => {
  //   try {
  //     const payload = req?.body || {};
  //     let getintouch = new Getintouch(payload);
  //     // await mailNotification.supportmail(payload)
  //     const blg = await getintouch.save();
  //     return response.ok(res, blg);
  //   } catch (error) {
  //     return response.error(res, error);
  //   }
  // },
  // updateGetInTouch: async (req, res) => {
  //   try {
  //     await Getintouch.findByIdAndUpdate(req.params.id, { read: true });
  //     return response.ok(res, { message: 'read' });
  //   } catch (error) {
  //     return response.error(res, error);
  //   }
  // },
  // getGetInTouch: async (req, res) => {
  //   try {
  //     let blog = await Getintouch.find().sort({ createdAt: -1 });
  //     return response.ok(res, blog);
  //   } catch (error) {
  //     return response.error(res, error);
  //   }
  // },
  changePasswordProfile: async (req, res) => {
    try {
      let user = await User.findById(req.user.id);
      if (!user) {
        return response.notFound(res, { message: "User doesn't exists." });
      }
      user.password = user.encryptPassword(req.body.password);
      await user.save();
      mailNotification.passwordChange({ email: user.email });
      return response.ok(res, { message: "Password changed." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  // me: async (req, res) => {
  //   console.log('req.user.id----', req);
  //   try {
  //     console.log('req.user.id----', req.user.id);
  //     // let user = await userHelper.find({ _id: req.user.id }).lean();
  //     let data = await User.aggregate([
  //       {
  //         $match: { _id: new mongoose.Types.ObjectId(req.user.id) }
  //       },
  //       {
  //         $lookup: {
  //           from: 'quizzans',
  //           localField: '_id',
  //           foreignField: 'user',
  //           as: 'quizzs',
  //           pipeline: [
  //             {
  //               $project: {
  //                 'correct': 1,
  //                 'wrong': 1,
  //                 'total': 1,
  //                 "user": 1
  //               },
  //             },
  //             {
  //               $group: {
  //                 _id: "$user",
  //                 correct: { $sum: "$correct" },
  //                 wrong: { $sum: "$wrong" },
  //                 total: { $sum: "$total" },
  //               },
  //             },
  //           ],
  //         }
  //       },
  //       {
  //         $unwind: {
  //           path: '$quizzs',
  //           preserveNullAndEmptyArrays: true
  //         }
  //       },

  //     ])
  //     if (!data[0].quizzs) {
  //       data = [{
  //         ...data[0],
  //         quizzs: {
  //           correct: 0,
  //           wrong: 0,
  //           total: 0,
  //         }
  //       }]
  //     }
  //     return response.ok(res, data[0]);
  //   } catch (error) {
  //     return response.error(res, error);
  //   }
  // },
  // updateUser: async (req, res) => {
  //   delete req.body.password;
  //   try {
  //     let userDetail = await User.findById(req.user.id);
  //     // console, log(userDetail.phone, req.body.phone)
  //     if (userDetail.phone !== req.body.phone && !req.body.otp) {
  //       console.log(req.body.phone)
  //       await sendOtp.sendOtp(req.body.phone);
  //       // let ran_otp = Math.floor(1000 + Math.random() * 9000);
  //       return response.ok(res, { otp: true, message: "OTP sent to your phone number" });
  //     } else {
  //       let ver = await Verification.findOne({ phone: req.body.phone });
  //       if (req.body.otp && req.body.otp === ver.otp &&
  //         !ver.verified &&
  //         new Date().getTime() < new Date(ver.expiration_at).getTime()) {
  //         const user = await User.updateOne(
  //           { _id: req.user.id },
  //           { $set: req.body },
  //           { upsert: true, new: true }
  //         );
  //         ver.verified = true;
  //         await Verification.findOneAndDelete({ phone: req.body.phone });
  //         // let token = await new jwtService().createJwtToken({
  //         //   id: user._id,
  //         //   type: user.type,
  //         // });
  //         console.log(user);
  //         const data = {
  //           // token,
  //           ...user._doc,

  //         };
  //         return response.ok(res, { data, otp: false, message: "Profile Updated." });
  //       } else {
  //         return res.status(404).json({ success: false, message: "Invalid OTP" });
  //       }

  //     }
  //   } catch (error) {
  //     return response.error(res, error);
  //   }
  // },
  updateProfile: async (req, res) => {
    const payload = req.body;
    console.log(payload)
    const userId = req?.body?.userId || req.user.id;
    try {
      const u = await User.findByIdAndUpdate(
        userId,
        { $set: payload },
        {
          new: true,
          upsert: true,
        }
      );
      return response.ok(res, { message: "Profile Updated." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateUser: async (req, res) => {
    console.log(req.body)
    try {
      if (req.body.id) {
        await User.updateOne(
          { _id: mongoose.Types.ObjectId(req.body.id) },
          req.body.profile
        );
      } else {
        await User.findByIdAndUpdate(req.user.id, { $set: req.body });
      }

      return response.ok(res, { message: "Profile Updated." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  sendOTPForforgetpass: async (req, res) => {
    try {
      const email = req.body.email;
      const user = await User.findOne({ email });

      if (!user) {
        return response.badReq(res, { message: "Email does exist." });
      }
      // OTP is fixed for Now: 0000
      let ran_otp = Math.floor(1000 + Math.random() * 9000);
      await mailNotification.sendOTPmailForSignup({
        code: ran_otp,
        email: email
      });
      // let ran_otp = "0000";
      // if (
      //   !ver ||
      //   new Date().getTime() > new Date(ver.expiration_at).getTime()
      // ) {
      let ver = new Verification({
        //email: email,
        user: user._id,
        otp: ran_otp,
        expiration_at: userHelper.getDatewithAddedMinutes(5),
      });
      await ver.save();
      // }
      let token = await userHelper.encode(ver._id);

      return response.ok(res, { message: "OTP sent on your register E-mail ID.", token });
    } catch (error) {
      return response.error(res, error);
    }
  },
  sendOTP: async (req, res) => {
    try {
      const email = req.body.email;
      if (!email) {
        return response.badReq(res, { message: "Email required." });
      }
      const user = await User.findOne({ email });
      // let user2 = await User.findOne({
      //   email: payload.email.toLowerCase(),
      // });
      if (user) {
        return res.status(404).json({
          success: false,
          message: "Email already exists.",
        });
        // } if (user2) {
        //   return res.status(404).json({
        //     success: false,
        //     message: "Email Id already exists.",
        //   });
      } else {
        // await sendOtp.sendOtp(payload.phone)
        let ran_otp = "0000";
        // const data = req.body;
        const newPoll = new Verification({
          email: req.body.email,
          otp: ran_otp,
          expiration_at: userHelper.getDatewithAddedMinutes(5),
        });
        await newPoll.save();
        return res.status(200).json({
          success: true,
          message: "OTP sent to your Email ",
        });
      }
      // if (user) {
      // let ver = await Verification.findOne({ user: user._id });
      // OTP is fixed for Now: 0000
      // let ran_otp = Math.floor(1000 + Math.random() * 9000);
      // await mailNotification.sendOTPmail({
      //   code: ran_otp,
      //   email: user.email,
      // });
      let ran_otp = "0000";
      if (
        !ver ||
        new Date().getTime() > new Date(ver.expiration_at).getTime()
      ) {
        ver = new Verification({
          user: user._id,
          otp: ran_otp,
          expiration_at: userHelper.getDatewithAddedMinutes(5),
        });
        await ver.save();
      }
    } catch (error) {
      return response.error(res, error);
    }
  },

  verifyOTP: async (req, res) => {
    try {
      const otp = req.body.otp;
      const token = req.body.token;
      if (!(otp && token)) {
        return response.badReq(res, { message: "otp and token required." });
      }
      let verId = await userHelper.decode(token);
      let ver = await Verification.findById(verId);
      if (
        otp == ver.otp &&
        !ver.verified &&
        new Date().getTime() < new Date(ver.expiration_at).getTime()
      ) {
        let token = await userHelper.encode(
          ver._id + ":" + userHelper.getDatewithAddedMinutes(5).getTime()
        );
        ver.verified = true;
        await ver.save();
        return response.ok(res, { message: "OTP verified", token });
      } else {
        return response.notFound(res, { message: "Invalid OTP" });
      }
    } catch (error) {
      return response.error(res, error);
    }
  },
  changePassword: async (req, res) => {
    try {
      const token = req.body.token;
      const password = req.body.password;
      const data = await userHelper.decode(token);
      const [verID, date] = data.split(":");
      if (new Date().getTime() > new Date(date).getTime()) {
        return response.forbidden(res, { message: "Session expired." });
      }
      let otp = await Verification.findById(verID);
      if (!otp.verified) {
        return response.forbidden(res, { message: "unAuthorize" });
      }
      let user = await User.findById(otp.user);
      if (!user) {
        return response.forbidden(res, { message: "unAuthorize" });
      }
      await Verification.findByIdAndDelete(verID);
      user.password = user.encryptPassword(password);
      await user.save();
      mailNotification.passwordChange({ email: user.email });
      return response.ok(res, { message: "Password changed! Login now." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  notification: async (req, res) => {
    try {
      let notifications = await Notification.find({
        for: req.user.id,
        deleted: { $ne: true },
      })
        .populate({
          path: "invited_for",
          populate: { path: "job" },
        })
        .sort({ updatedAt: -1 })
        .lean();
      return response.ok(res, { notifications });
    } catch (error) {
      return response.error(res, error);
    }
  },
  deleteNotification: async (req, res) => {
    try {
      let notification_id = req.params["not_id"];
      await Notification.updateMany(
        notification_id
          ? { for: req.user.id, _id: notification_id }
          : { for: req.user.id },
        { deleted: true }
      );
      return response.ok(res, { message: "Notification(s) deleted!" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateSettings: async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.user.id, { $set: req.body });
      return response.ok(res, { message: "Settings updated." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getSettings: async (req, res) => {
    try {
      const settings = await User.findById(req.user.id, {
        notification: 1,
        distance: 1,
      });
      return response.ok(res, { settings });
    } catch (error) {
      return response.error(res, error);
    }
  },
  // fileUpload: async (req, res) => {
  //   try {
  //     const userId = req.body.gaurd_id || req.user.id;
  //     let key = req.file && req.file.key,
  //       type = req.body.type;
  //     let ident = await Identity.findOne({ type, user: userId });
  //     if (!ident) {
  //       ident = new Identity({ key, type, user: userId });
  //     }
  //     if (key) {
  //       ident.key = key; //update file location
  //     }
  //     if (req.body.expire && type == "SI_BATCH") {
  //       ident.expire = req.body.expire;
  //     }
  //     await ident.save();
  //     return response.ok(res, {
  //       message: "File uploaded.",
  //       file: `${process.env.ASSET_ROOT}/${key}`,
  //     });
  //   } catch (error) {
  //     return response.error(res, error);
  //   }
  // },
  getCleaners: async (req, res) => {
    try {
      let u = await User.find({ type: "CLEANER", isDeleted: false });
      return response.ok(res, u);
    } catch (error) {
      return response.error(res, error);
    }
  },
  postnotification: async (req, res) => {
    try {
      const data = req.body;
      const newnoti = new Notification(data);
      const response = await newnoti.save();
      console.log("data saved");
      res.status(200).json(response);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getnotibyuser: async (req, res) => {
    try {
      const event = req.params.id;
      const serviceid = await Notification.find({ for: event });
      console.log("data fetched");
      res.status(200).json(serviceid);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  notification: async (req, res) => {
    try {
      let notifications = await Notification.find({
        for: req.user.id,
        deleted: { $ne: true },
      })
        .populate({
          path: "invited_for",
          populate: { path: "job", select: "-fullObj" },
        })
        .sort({ updatedAt: -1 })
        .lean();
      return response.ok(res, { notifications });
    } catch (error) {
      return response.error(res, error);
    }
  },
  deleteNotification: async (req, res) => {
    try {
      let notification_id = req.params["not_id"];
      await Notification.updateMany(
        notification_id
          ? { for: req.user.id, _id: notification_id }
          : { for: req.user.id },
        { deleted: true }
      );
      return response.ok(res, { message: "Notification(s) deleted!" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  verifyUser: async (req, res) => {
    try {
      await User.updateOne(
        { email: req.body.email },
        { $set: { verified: req.body.verified } }
      );
      return response.ok(res, {
        message: req.body.verified ? "Cleaner Verified." : "Cleaner Suspended.",
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  sendmessageservice: async (req, res) => {
    try {
      const email = req.body.email;
      const message = req.body.message;
      await mailNotification.sendmessage({
        email: email,
        message: message,
      });
      return response.ok(res, { message: "Mail send succesfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getIp: async (req, res) => {
    try {
      const ress = await axios.get("https://ipinfo.io?token=c8ac68e6bdb4a8");
      console.log(ress.data);
      return response.ok(res, ress.data);
    } catch (error) {
      return response.error(res, error);
    }
  },

  fileUpload: async (req, res) => {
    try {
      let key = req.file && req.file.key;
      return response.ok(res, {
        message: "File uploaded.",
        file: `${process.env.ASSET_ROOT}/${key}`,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  urlToupload: async (req, res) => {
    try {
      const axiosResponse = await axios({
        url: req.body.url, //your url
        method: "GET",
        responseType: "arraybuffer",
      });
      const Key = req.body.url.split('/')[req.body.url.split('/').length - 1]
      const d = await putS3Object({ Body: axiosResponse.data, Key })
      return response.ok(res, {
        message: "File uploaded.",
        file: d,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },


  // dashboard: async (req, res) => {
  //   try {
  //     console.log('req.user.id----', req.user.id);
  //     const data = await User.aggregate([
  //       {
  //         $group: {
  //           _id: "subscriber",
  //           allusers: {
  //             $sum: 1
  //           },
  //           "subscriber": {
  //             "$sum": {
  //               $cond: {
  //                 if: { $eq: ['$subscribe', true] },
  //                 then: 1,
  //                 else: 0
  //               }
  //             }
  //           },
  //           "unsubscriber": {
  //             "$sum": {
  //               $cond: {
  //                 if: {
  //                   $eq: ['$subscribe', false]
  //                 },
  //                 then: 1,
  //                 else: 0
  //               }
  //             }
  //           },
  //         },
  //       },
  //     ])
  //     const today = moment(new Date()).format('YYYY-MM-DD');
  //     const week = moment(new Date().setDate(new Date().getDate() - 7)).format('YYYY-MM-DD');
  //     const month = moment(new Date().setMonth(new Date().getMonth() - 1)).format('YYYY-MM-DD');

  //     const quiz = await quizz.aggregate([
  //       {
  //         $group: {
  //           _id: "uploadQuizz",
  //           allquizs: {
  //             $sum: 1
  //           },
  //           "today": {
  //             "$sum": {
  //               $cond: {
  //                 if: { $gte: ["$createdAt", new Date(today)] },
  //                 then: 1,
  //                 else: 0
  //               }
  //             }
  //           },
  //           "week": {
  //             "$sum": {
  //               $cond: {
  //                 if: { $gte: ["$createdAt", new Date(week)] },
  //                 then: 1,
  //                 else: 0
  //               }
  //             }
  //           },
  //           "month": {
  //             "$sum": {
  //               $cond: {
  //                 if: { $gte: ["$createdAt", new Date(month)] },
  //                 then: 1,
  //                 else: 0
  //               }
  //             }
  //           },
  //         },
  //       },
  //     ])
  //     const newData = {
  //       users: data[0],
  //       quiz: quiz[0]
  //     }
  //     return response.ok(res, newData);
  //   } catch (error) {
  //     return response.error(res, error);
  //   }
  // },
};
