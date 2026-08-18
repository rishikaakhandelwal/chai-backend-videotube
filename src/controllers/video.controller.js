import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const getAllVideos = asyncHandler(async(req, res)=>{
    // await Video.find
    
    console.log("reached the get all videos controller! rest will be done later")
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Videos fetched.")
    )
})//this one will be done later

const publishAVideo = asyncHandler(async(req, res)=>{
    const {title, description, isPublished} = req.body
    if(!title || !description) throw new ApiError(400, "Please send complete details.");

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    if(!thumbnailLocalPath || !videoLocalPath) throw new ApiError(500, "Something went wrong while uploading the files");

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!videoFile || !thumbnail) throw new ApiError(500, "Something went wrong while uploading the files on cloudinary.");

    const video = await Video.create({
        title: title,
        description: description,
        isPublished: isPublished,
        thumbnail: thumbnail.url,
        videoFile: videoFile.url,
        owner: req.user._id,
        duration: videoFile.duration
    })
    if(!video) throw new ApiError(500, "Could not publish the video.")
    // console.log(video)// mera kaam isi video se chal gya isliye mene dubara db me search nhi kiya video ki taki me use return kru

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video published.")
    )
})

const getVideoById = asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(404, "Video not found!");

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Here is the video.")
    )
})

const updateVideo = asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
    // const {owner} = await Video.findById(videoId)
    // console.log(owner)
    // console.log(req.user._id)
    // if(owner!=req.user._id) throw new ApiError(401, "Unauthorised request.")

    const videoTocheck  = await Video.findById(videoId)
    if(!videoTocheck) throw new ApiError(404, "Video not found!");
    if(!videoTocheck.owner.equals(req.user._id)) throw new ApiError(401, "Unauthorised request.");

    const {title, description, isPublished} = req.body

    const thumbnailLocalPath = req.file?.path
    if(!thumbnailLocalPath && !title && !description && isPublished===undefined) throw new ApiError(400, "Please send something to edit.");

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(thumbnailLocalPath && !thumbnail) throw new ApiError(500, "Something went wrong while uploading the file.");

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title: title,
                description: description,
                isPublished: isPublished,
                thumbnail: thumbnail?.url,
            }
        },
        {new: true}
    )
    if(!video) throw new ApiError(500, "Could not update the video.");

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video Updated!")
    )
})

const deleteVideo = asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
    const videoTocheck  = await Video.findById(videoId)
    if(!videoTocheck) throw new ApiError(404, "Video not found!");
    if(!videoTocheck.owner.equals(req.user._id)) throw new ApiError(401, "Unauthorised request.");

    const video = await Video.findByIdAndDelete(videoId)
    if(!video) throw new ApiError(404, "No video with that id found.");

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video deleted.")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo
}