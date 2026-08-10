import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String, //encryption kese krenge? or encrypted string ko compare kese krenge fir?
        required: [true, 'Password is required']
    },
    fullName: {
        type: String,
        requried: true,
        trim: true,
        index: true
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    avatar: {
        type: String, //cloudinary url
        required: true
    },
    coverImage: {
        type: String
    },
    refreshToken: { //ye kya hote h ye dekhna bacha h
        type: String
    }
}, { timestamps: true })

userSchema.pre("save", async function (next) { //save event ka naam h ki ye function save ke event par chalega, or yah arrow func mat likhna kyuki usme this ko context nhi pata hota
    if (!this.isModified("password")) return ;

    this.password = await bcrypt.hash(this.password, 8)
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User = mongoose.model("User", userSchema)