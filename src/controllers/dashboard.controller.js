import mongoose from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"

// TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const channelDetails = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {$size: "$subscribers"},
                    subscribedToCount: {$size: "$subscribedTo"}
                }
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    subscribersCount: 1,
                    subscribedToCount: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
                }
            }
        ])
    
    if(!channelDetails?.length){
        throw new ApiError(404, "Channel does not exists.")
    }

    const viewsDetails = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {$sum: "$views"},
                totalVideos: { $sum: 1 }
            }
        }
    ])
    const totalViewsOfChannel = viewsDetails[0]?.totalViews || 0
    const totalVideosOfChannel = viewsDetails[0]?.totalVideos || 0

    const likeDetails = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "video",
                as: "videoDetails"
            }
        },
        {
            $lookup: {
                from: "tweets",
                foreignField: "_id",
                localField: "tweet",
                as: "tweetDetails"
            }
        },
        {
            $match: {
                $or: [
                    {"videoDetails.owner": new mongoose.Types.ObjectId(userId)},
                    {"tweetDetails.owner": new mongoose.Types.ObjectId(userId)}
                ]
            }
        },
        {
            $count: "totalLikes"
        }
    ])

    const totalLikesOfChannel = likeDetails[0]?.totalLikes || 0

    const returnedResponse = {...channelDetails[0], totalViewsOfChannel, totalVideosOfChannel, totalLikesOfChannel}

    return res
    .status(200)
    .json(new ApiResponse(200, returnedResponse, "Channel stats fetched."))
    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const videoList = await Video.find({owner: userId})

    return res
    .status(200)
    .json(new ApiResponse(200, videoList, "Video list fetched."))
})

export {
    getChannelStats, 
    getChannelVideos
}