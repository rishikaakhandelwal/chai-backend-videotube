import {ApiError} from "../utils/ApiError.js"
import { Comment } from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})//later

const addComment = asyncHandler(async (req, res) => {
    const {content} = req.body
    if(!content) throw new ApiError(400, "Please give content.")

    const {videoId} = req.params
    if(!videoId) throw new ApiError(400, "Wrong url.")
    const videoCheck = await Video.findById(videoId)
    if(!videoCheck) throw new ApiError(400, "No such video found.")
 
    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id
    })
    if(!comment) throw new ApiError(500, "We could not create the comment.")

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment created|")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id
    const commentCheck = await Comment.findById(commentId)
    if(!commentCheck) throw new ApiError(400, "No such comment found.")
    if(!commentCheck.owner.equals(userId)) throw new ApiError(401, "you are not the owner of this comment.")

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: content
            }
        }
    )

    if(!comment) throw new ApiError(500, "The comment could not be updated.")
    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment updated.")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id
    const commentCheck = await Comment.findById(commentId)
    if(!commentCheck) throw new ApiError(400, "No such comment found.")
    if(!commentCheck.owner.equals(userId)) throw new ApiError(401, "you are not the owner of this comment.")

    const comment = await Comment.findByIdAndDelete(commentId)

    if(!comment) throw new ApiError(500, "The comment could not be deleted.")
    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment deleted.")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}