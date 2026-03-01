import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ // Using CORS
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "16kb"})); // To accept any json files under 16 kb
app.use(express.urlencoded({extended:true, limit: "16kb"})); // To accept data from the url from frontend
app.use(express.static("public")); // If we ever need t send any static data(present in public)
app.use(cookieParser());


//routes import
import userRouter from "./routes/user.routes.js";



// routes declaration
app.use("/api/v1/users", userRouter);


export {app};