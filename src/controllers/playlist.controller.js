import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user._id
    if(!name || name.trim() === "" || !description || description.trim() === "") throw new ApiError(400, "Please provide both the name and description of the playlist.");

    const playlist = await Playlist.create({
        owner: userId,
        name: name,
        description: description
    })

    if(!playlist) throw new ApiError(500, "Could not create the playlist.");

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created."))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)) throw new ApiError(400, "Invalid user Id.")
    
    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        }
    ])
    if(!userPlaylists.length===0) throw new ApiError(404, "Could not find user palylists.");

    return res
    .status(200)
    .json(new ApiResponse(200, userPlaylists, "Playlists fetched."))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist Id.")
    
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        }
    ])
    if(!playlist.length ===0) throw new ApiError(404, "Could not find a playlist with the given Id.");

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched."))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(400, "Invalid ids.");
    const userId = req.user._id
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(404, "Could find a playlist with this Id.");
    if(!playlist.owner.equals(userId)) throw new ApiError(401, "You are not the owner of this playlist.");

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { video: videoId }
        },
        {new: true}
    )
    if(!updatedPlaylist) throw new ApiError(500, "Could not add the video.");

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added."))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(400, "Invalid ids.");
    const userId = req.user._id
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(404, "Could find a playlist with this Id.");
    if(!playlist.owner.equals(userId)) throw new ApiError(401, "You are not the owner of this playlist.");

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {video: videoId}
        },
        {new: true}
    )
    if(!updatedPlaylist) throw new ApiError(500, "Could not remove the video.");

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed."))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid id.");
    const userId = req.user._id
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(404, "Could find a playlist with this Id.");
    if(!playlist.owner.equals(userId)) throw new ApiError(401, "You are not the owner of this playlist.");

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if(!deletedPlaylist) throw new ApiError(500, "Could not delete the playlist.");

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted."))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid id.");
    const userId = req.user._id
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(404, "Could find a playlist with this Id.");
    if(!playlist.owner.equals(userId)) throw new ApiError(401, "You are not the owner of this playlist.");
    const {name, description} = req.body
    if(!name && !description) throw new ApiError(400, "Please send something to update.");

    const updatedFields = {}
    if(name) updatedFields.name = name
    if(description) updatedFields.description = description
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {updatedFields}
        },
        {new: true}
    )
    if(!updatedPlaylist) throw new ApiError(500, "Could not update the playlist.");

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated."))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}