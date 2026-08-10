import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId) //to function k argument me user hi to le lete
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //steps:
    // 1: get user details from frontend or kya data lena h vo user model se pta chalega;
    // 2: validation, koi field empty ya wrong format to nhi h;
    // 3: check if user already exists using email username or whatever;
    // 4: check for images, check for avatar;
    // 5: upload them to cloudinary, avatar upload hona chahiye;
    // 6: creat user object-create entry in db;
    // 7: remove password and refresh token field from response;
    // 8: check for user create to ho gya n;
    // 9: return res, nhi to error


    //step 1: thoda thoda likh k test krte rhe sath me
    //url se bhi data aa skta, but vo baad me dekhnge
    const { fullName, email, username, password } = req.body
    console.log("email: ", email)

    //file json me nhi milegi, file k lie userroutes.js me multer import krvao, or middleware inject krdo with some tamjham in it 

    // 2: 
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    //ab email ke format ka checking bhi kr skte h ek if else me


    //3:
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, "User with this email or username already exists")
    } //ham chahe to dono ko alag alag bhi check kr skte h
    
    
    
    //4:
    //hamne middleware lgaya h usne req.files bna diya hoga, usme files hongi
    //but dono me konsi ko avatar bolna h ye kese hoga? frontend me?
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    
    
    //5:
    //yha par alag se await kyuki intentionally yha rukna h
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) //check nhi kia ki ye image h ya nhi to upload kese kia
    
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    // 6:
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //7:
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //8:
    if(!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    //9:
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) =>{
    //steps:
    //1: req body se data lo
    //2: find the user
    //3: password check kro
    //4: access and refreshtoken generate krke bhejo, cookie me? yes
    //5: send cookie

    const {email, username, password} = req.body
    if(!username && !email){ //&& ana chahiye na? yes
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exists")
    }

    // console.log("USER", user)
    console.log("type of user: ", typeof user)
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(401, "password incorrect")
    }

    const {refreshToken, accessToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") //agar db call expensive lag rha h to user me hi refreshtoken dalke loggedinuser bana lo
    //jab yha se refreshtoken hata hi diya to vhi user hi to send kr dete

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser,
            accessToken,
            refreshToken
        }),
        "User logged in successfully"
    )

})

const logoutUser = asyncHandler(async(req, res)=>{
    console.log("LOGOUT CONTROLLER CALLED")
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //undefined nhi likhna h yha 1 likho
            }
        },
        {new: true}
    )
    console.log("WE FOUND THE USER")
    const options = {
        httpOnly: true,
        secure: true
    }
    console.log("SENDING THE RESPONSE")
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req, res)=>{ //mujhe ye walal controller thoda kam smjh me aya h

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken //refresh token cookies se lelo
    if(!incomingRefreshToken) throw new ApiError(401, "anuthorised request");

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id)
        if(!user) throw new ApiError(401, "invalid refreshtoken")
    
    
        if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "refresh token is expired or used"); //is if ki i dont think need thi
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {accessToken, refreshToken}, "access token refreshed")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{  //user already logged in h ya nhi h, cookies h ya nhi ye ham verifyjwt se check kr lenge, kr diyaaaaa
    const {oldPassword, newPassword} = req.body //confirm password bhi h to use bhi lelo or ek check lga do ki ye or newpassword equal hone chahiye, vrna error dedo

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid) throw new ApiError(400, "invalid old password");

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed")
    )
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "current user fetched")
    )
})

const updateAccountDetails = asyncHandler(async(req, res)=>{ //file update krvani h to alag endpoint banao
    const {fullName, email} = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "all fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "account details updated")
    )
})//isme bhi verifyjwt lgaenge? lgana chahiye kyuki req.user use kia h, ha lgaya h hamne verifyjwttttt

const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) throw new ApiError(400, "avatar is missing");
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) throw new ApiError(400, "error while uploading on avatar");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
    //ye sara hone k baad ek utility func bnakar cloudinary par se purani image ko delete krva do

    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated"))
})//ispe multer middleware lgega or since req.user use kia h to verifyjwt bhi lagna chahiye, yes, rightttt

const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) throw new ApiError(400, "cover image is missing");
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) throw new ApiError(400, "error while uploading on coverImage");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated"))
})//ispe multer middleware lgega or since req.user use kia h to verifyjwt bhi lagna chahiye

const getUserChannelPofile = asyncHandler(async(req, res)=>{
    const {username} = req.params
    if(!username?.trim()) throw new ApiError(400, "username is missing");

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
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
                subscribedToCount: {$size: "$subscribedTo"},
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed:1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return req
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched")
    )
})//yha kuch esa kia h ki verifyjwt ki jroorat ho?

const getWatchHistory = asyncHandler(async(req, res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched"))
})

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage,
    getUserChannelPofile,
    getWatchHistory
}