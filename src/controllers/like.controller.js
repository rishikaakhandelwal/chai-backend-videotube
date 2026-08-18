// use isValidObjectId later
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    const likeCheck = await Like.findOne({ video: videoId, likedBy: userId })
    if (likeCheck) {
        const like = await Like.findOneAndDelete({ video: videoId, likedBy: userId })
        return res
            .status(200)
            .json(new ApiResponse(200, like, "like deleted."))
    } else {
        const like = await Like.create({
            video: videoId,
            likedBy: userId
        })

        if (!like) throw new ApiError(500, "Could not like the video.")

        return res
            .status(200)
            .json(
                new ApiResponse(200, like, "Liked the video.")
            )
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user._id

    const likeCheck = await Like.findOne({ comment: commentId, likedBy: userId })
    if (likeCheck) {
        const like = await Like.findOneAndDelete({ commento: commentId, likedBy: userId })
        return res
            .status(200)
            .json(new ApiResponse(200, like, "like deleted."))
    } else {
        const like = await Like.create({
            comment: commentId,
            likedBy: userId
        })

        if (!like) throw new ApiError(500, "Could not like the comment.")

        return res
            .status(200)
            .json(
                new ApiResponse(200, like, "Liked the comment.")
            )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user._id

    const likeCheck = await Like.findOne({ tweet: tweetId, likedBy: userId })
    if (likeCheck) {
        const like = await Like.findOneAndDelete({ tweet: tweetId, likedBy: userId })
        return res
            .status(200)
            .json(new ApiResponse(200, like, "like deleted."))
    } else {
        const like = await Like.create({
            tweet: tweetId,
            likedBy: userId
        })

        if (!like) throw new ApiError(500, "Could not like the tweet.")

        return res
            .status(200)
            .json(
                new ApiResponse(200, like, "Liked the tweet.")
            )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const likes = await Like.find({ owner: userId })

    // console.log(tweets)

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Here are the tweets."))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}