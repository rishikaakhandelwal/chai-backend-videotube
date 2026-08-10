//ye verify krega ki user h ya nhi h

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req, _, next) => { // _ kyuki res ki jroorat nhi 
    try {
        console.log("TRYING TO ACCESS THE TOKEN IN VERIFYJWT")

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token) throw new ApiError(401, "unauthorised request");

        console.log("WE GOT THE TOKEN, NOW DECODING IT")
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user) throw new ApiError(401, "invalid access token") //we will discuss about frontend here
        
        console.log("RETURNING THE USER WE FOUND")
        req.user = user;
        next()  //ye likhu kya? yes
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
    }
})