"use strict";
const router = require("express").Router();
const { default: mongoose } = require("mongoose");
const user = require("../../app/controller/user");
const story = require("../../app/controller/story");
const contact = require("../../app/controller/contact");
const plan = require("../../app/controller/plan");
const rating = require("../../app/controller/ratings");
const stripe = require("../../app/controller/stripe");

// const chapter = require("../../app/controller/chapter");

const isAuthenticated = require("./../../middlewares/isAuthenticated");
const { upload } = require("../../app/services/fileUpload");
// const quizz = require("../../app/controller/quizz");
// const faq = require("../../app/controller/faq");
// const content = require("../../app/controller/content");
// const topic = require("../../app/controller/topic");
// const subscriptionplan = require("../../app/controller/subscriptionplan");
// const poll =require("../../app/controller/poll")
// const event =require("../../app/controller/event")

// auth routes
router.post("/login", user.login);
router.post("/register", user.register);
router.get("/getUsers", user.getAllUsers);
router.post("/sendOTPForforgetpass", user.sendOTPForforgetpass);
router.post("/verifyOTP", user.verifyOTP);
router.post("/changePassword", user.changePassword);
router.delete("/deleteuser/:id", user.deleteuser);
router.get("/userip", user.getIp);
router.post("/postip", user.postip);
router.get("/getuserbyid", isAuthenticated(["USER"]), user.getuserbyid);
router.post("/user/fileupload", upload.single("file"), user.fileUpload);
router.post("/user/fileupload2", user.urlToupload2);
router.put("/updateplaninuser", isAuthenticated(["USER"]), user.updateplaninuser);
//  router.get("/deviceMiddleware",isAuthenticated(["USER"]), user.deviceMiddleware);

router.get("/cheakdevice", isAuthenticated(["USER"]), user.cheakdevice);
// router.post("/signUp", user.signUp);
// router.post("/delUser", user.delUsers);
// router.post("/getintouch", user.createGetInTouch);
// router.get("/getgetintouch", user.getGetInTouch);
// router.post("/sendOTP", user.sendOTP);
// router.post("/sendmessageservice", user.sendmessageservice);
// router.post("/adminLogin", user.adminLogin);
// router.post("/sendOTPForLogin", user.sendOTPForLogin);
// router.post("/sendOTPForSignUp", user.sendOTPForSignUp);


router.post("/updateProfile", isAuthenticated(["USER", "ADMIN",]), user.updateUser);
// router.get("/getProfile", isAuthenticated(["USER", "ADMIN"]), user.me);
// router.get("/dashboard",  user.dashboard);
router.post("/profile/changePassword", isAuthenticated(["USER", "ADMIN"]), user.changePasswordProfile);

//story
router.post("/generate_story", isAuthenticated(["USER"]), story.generate_story);
router.get("/getallstory", story.getallstory);
router.get("/getstory/:id", isAuthenticated(["USER"]), story.getstory);

router.get("/getstorybyuser/:id", story.getstorybyuser);

router.put("/updatepstory/:id", story.updatepstory);
router.delete("/deletestory/:id", story.deletestory);
router.put("/likeplus/:id", isAuthenticated(["USER"]), story.likeplus);
router.put("/favouriteplus/:id", isAuthenticated(["USER"]), story.favouriteplus);
//contact
router.post("/postcontact", contact.postcontact);
router.get("/getallcontact", contact.getallcontact);
router.delete("/deletecontact/:id", contact.deletecontact);

//plan
router.post("/postplan", plan.postplan);
router.get("/getallplan", plan.getallplan);
router.put("/updateplan/:id", plan.updateplan);

//rating
router.post("/postrating/:id", isAuthenticated(["USER"]), rating.postrating);


//stripe
router.post("/poststripe", stripe.poststripe);



module.exports = router;
