import {Subscription} from "../models/subscription.model.js"
import { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channelId.")
    const userId = req.user._id
    
    const subscriptionCheck = await Subscription.findOne({subscriber: userId, channel: channelId})
    if(subscriptionCheck){
        const deleteSubscription = await Subscription.findByIdAndDelete(subscriptionCheck._id)
        if(!deleteSubscription) throw new ApiError(500, "Could not unsubscribe.");
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Unsubscribed.")) 
    }

    const subscribing = await Subscription.create({subscriber: userId, channel: channelId})
    if(!subscribing) throw new ApiError(500, "Could not subscribe.");

    return res
    .status(200)
    .json(new ApiResponse(200, subscribing, "Subscribed."))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channelId.")
    const userId = req.user._id

    const subsList = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    { $project: { username: 1, fullName: 1, avatar: 1 } }
                ]
            }
        },
        {
            $unwind: "$subscriber"
        },
        {
            $replaceRoot: {newRoot: "$subscriber"}
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subsList, "Subscribers list fetched."))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)) throw new ApiError(400, "Invalid subscriberId.")
    const userId = req.user._id

    const channelList = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    { $project: { username: 1, fullName: 1, avatar: 1 } }
                ]
            }
        },
        {
            $unwind: "$channel"
        },
        {
            $replaceRoot: {newRoot: "$channel"}
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, channelList, "Subscribed Channels list fetched."))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}