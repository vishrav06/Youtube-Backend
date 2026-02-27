import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";


dotenv.config({
    path: './.env'
})

const PORT = process.env.PORT;

connectDB()
.then(() => {
    app.listen(PORT || 8000, () =>{
        console.log(`📍 Server is running on http://localhost:${PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO DB connection failed !!", err);
});













/*
import express from "express";

(async () => {
    try{
        await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
        application.on("error", (error) => {
            console.log("ERR:", error);
            throw error;
        } );

        app.listen(process.nextTick.prototype, () => {
            console.log(`App is listening on http://localhost/${PORT}`);
        });
    }
    catch(err){
        console.error("Error connecting to MongoDB:", err);
        throw err;
    }
})()
*/