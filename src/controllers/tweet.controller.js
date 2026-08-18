import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    if(!content || content.trim() === "") throw new ApiError(400, "Content is required.");

    const tweet = await Tweet.create({
        content: content,
        owner: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created."))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const tweets = await Tweet.find({ owner: userId })

    // console.log(tweets)

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Here are the tweets."))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Wrong url.")
    const userId = req.user._id
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) throw new ApiError(404, "No such tweet found with this Id.");
    if (!tweet.owner.equals(userId)) throw new ApiError(401, "You are not the owner of this tweet.");

    const { content } = req.body
    if (!content) throw new ApiError(400, "Please provide the updated content.")

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },
        { new: true }
    )
    if (!updatedTweet) throw new ApiError(500, "We failed to update the tweet.")

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet Updated."))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Wrong url.")
    const userId = req.user._id
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) throw new ApiError(404, "No such tweet found with this Id.");
    if (!tweet.owner.equals(userId)) throw new ApiError(401, "You are not the owner of this tweet.");

    await Tweet.findByIdAndDelete(tweetId)

    return res
        .status(200)
        .json(new ApiResponse(200,{}, "Tweet deleted."))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}