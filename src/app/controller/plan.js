const mongoose = require("mongoose");
const response = require("./../responses");
const Plan = mongoose.model("PLAN")
module.exports = {
    postplan: async (req, res) => {
        try {
            const data = req.body
            const newService = new Plan(data);
            const newresponse = await newService.save();
            console.log('data saved');
            return response.ok(res, { message: "Plan Created", newresponse });
            // res.status(200).json(response);
        } catch (err) {
            console.log(err);
            return response.error(res, err);
            // res.status(500).json({error:'Internal Server Error'});
        }
    },
    getallplan: async (req, res) => {
        try {
            const data = await Plan.find();
            console.log('data fetched');
            return response.ok(res, data);
            // res.status(200).json(data);
        } catch (err) {
            console.log(err);
            return response.error(res, err);
            // res.status(500).json({error:'Internal Server Error'});
        }
    },
    // getPlan:async(req,res)=>{
    //     try {
    //         const serviceid = await Event.findById(
    //             req?.params?.id
    //           )
    //         console.log('data fetched');
    //         res.status(200).json(serviceid);
    //     } catch (err) {
    //         console.log(err);
    //         res.status(500).json({error:'Internal Server Error'});
    //     }
    // },
    updateplan: async (req, res) => {
        try {
            const BasicdataId = req.params.id;
            const BasicdataData = req.body;
            console.group(BasicdataData)
            const newresponse = await Plan.findByIdAndUpdate(BasicdataId, BasicdataData, {
                new: true,//return the updateed document
                runValidators: true, //Run Mongoose validation
            });
            if (!newresponse) {
                return res.status(404).json({ error: 'Service not found' });
            }
            console.log('data updated');
            return response.ok(res, { message: "Plan updated", newresponse });
            // res.status(200).json(response);

        } catch (err) {
            console.log(err);
            return response.error(res, err);
            // res.status(500).json({error:'Internal Server Error'});
        }

    },
    // deleteevent:async(req,res)=>{
    //     try {
    //         const BasicdataId=req.params.id;
    //         const newresponse=await Event.findByIdAndDelete(BasicdataId) ;
    //         if (!response) {
    //             return res.status(404).json({error:'Person not found'}); 
    //         } 
    //         console.log('data updated');
    //         return response.ok(res, { message: "Event updated", newresponse });
    //         // res.status(200).json(response);

    //     } catch (err) {
    //         console.log(err);
    //         return response.error(res, err);
    //         // res.status(500).json({error:'Internal Server Error'});
    //     }
    // },
}