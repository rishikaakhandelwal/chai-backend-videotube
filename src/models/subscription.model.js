import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId, //one who is subscribing
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId, //jisko subscribe kiya h
        ref: "User"
    }
}, {timestamps: true})

subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true })

export const Subscription = mongoose.model("Subscription", subscriptionSchema)