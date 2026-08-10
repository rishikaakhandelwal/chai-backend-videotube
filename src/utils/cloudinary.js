//server pe file aa chuki h, uska local path do , use ham cloudinary pe dal denge
// or fir server se vo file remove bhi kr do

import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs' //filesystem

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async(localFilePath)=>{
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // console.log(response.url)
        fs.unlinkSync(localFilePath)
        return response

        //ab file hata bhi do server se?
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the file jo server par temporarily save hui thi, jab upload fail ho gya

    }
}

export default uploadOnCloudinary