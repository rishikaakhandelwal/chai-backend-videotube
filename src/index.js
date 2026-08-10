// require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        app.on('error', (error) => {
            console.log('errr: ', error)
            throw error
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is listening at port http://localhost:${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("mongodb connection failed, ", err)
    })

















/*
import express from "express";
const app = express()

// always use try catch and async await
// function() and then function chala do is also good approach but we will use iffie
// iffe k starting me ; lagana ek achi practice h

(async () =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error', (error)=>{
            console.log('errr: ', error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})()
*/