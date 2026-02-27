import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB();













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