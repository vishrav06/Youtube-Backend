import {v2 as cloudinary} from "cloudinary";

import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;

        //uploading the file on cloud
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // File upload successful
        console.log("file has been uploaded on cloudinary ", response.url);

        return response;
    }
    catch(error){
        fs.unlinkSync(localFilePath); //Remove the loaclly saved temp file if the upload gets failed
        return null;
    }
} 


export {uploadOnCloudinary};