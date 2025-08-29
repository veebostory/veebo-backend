const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    credentials: {
        secretAccessKey: process.env.AWS_SECRET_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY
    },
    region: process.env.BUCKET_REGION
});

const bucketParams = {
    Bucket: process.env.BUCKET_NAME,
};

module.exports = {
    putS3Object: async (inputParams) => {
        try {
            const data = await s3Client.send(
                new PutObjectCommand({
                    ...bucketParams,
                    Body: inputParams.Body,
                    Key: `${inputParams.Key}`,
                })
            );
            return `${process.env.ASSET_ROOT}/${inputParams.Key}`
        } catch (err) {
            console.log("Error", err);
        }
    }
}


