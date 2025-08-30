
// const multer = require('multer')

// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });
// console.log(process.env.CLOUDINARY_CLOUD_NAME)
// console.log(process.env.CLOUDINARY_API_KEY)
// console.log(process.env.CLOUDINARY_API_SECRET)
// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: "veebo_uploads",
//         format: async (req, file) => "png",
//         public_id: (req, file) => Date.now() + "-" + file.originalname,
//     },
// });

// console.log(storage)

// module.exports = {


//     upload: multer({
//         storage: storage,
//         limits: { fileSize: 10 * 1024 * 1024 },
//     }),

//     uploadFromUrl: async (url) => {
//         console.log(url)
//         try {
//             const result = await cloudinary.uploader.upload(
//                 url,
//                 { folder: "veebo_uploads" }
//             );

//             console.log("Upload successful:", result.secure_url);
//             return result
//         } catch (error) {
//             console.error("Error uploading:", error);
//         }
//     }


// }



const multer = require('multer'),
    multerS3 = require('multer-s3');
// const { S3Client } = require('@aws-sdk/client-s3');
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// s3 = new S3Client({
//     credentials: {
//         secretAccessKey: process.env.AWS_SECRET_KEY,
//         accessKeyId: process.env.AWS_ACCESS_KEY
//     },
//     region: 'us-east-1'
// });
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "veebo_uploads",
        format: async (req, file) => "png",
        public_id: (req, file) => Date.now() + "-" + file.originalname,
    },
});
module.exports = {
    upload: multer({
        storage: storage,
        limits: { fileSize: 10 * 1024 * 1024 },
    }),
    uploadFromUrl: async (url) => {
        console.log(url)
        try {

            console.log(cloudinary)
            const result = await cloudinary.uploader.upload(
                url,
                { folder: "story_images" }
            );

            console.log("Upload successful:", result.secure_url);
            return result
        } catch (error) {
            console.error("Error uploading:", error);
        }
    }
}