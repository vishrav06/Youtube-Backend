import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import { request } from "express";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(  async (req, res) =>{
    // get user details from frontend
    // Validate the user details - not empty
    // Check if user already exists: check using username or email
    // Check if files are available (cover image and avatar)
    // upload files to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token from response
    // Check for user creation
    // return response

    const {fullName, email, password, username, }= req.body;
    console.log("email: ", email);

    if(
        [fullName, email, username, password].some((field) =>{
            return field?.trim ==="";
        })
    ){
        throw new ApiError(400, "All fields are required");
    }


    const existedUser = User.findOne({
        $or: [{ username } , { email }]
    });
    
    if (existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }


    const avatarLocalPath = request.files?.avatar[0]?.path;
    const coverImageLocalPath = request.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );


    if(!createdUser){
        throw new ApiError(500, "Something went wrog registering user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    );











});

export {registerUser};
