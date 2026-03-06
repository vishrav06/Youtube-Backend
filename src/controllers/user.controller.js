import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import { request } from "express";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        
        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Couldn't generate access Token")
    }
};

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
            return field?.trim() ==="";
        })
    ){
        throw new ApiError(400, "All fields are required");
    }


    const existedUser = await User.findOne({
        $or: [{ username } , { email }]
    });
    
    if (existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }



    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

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

const loginUser = asyncHandler(async (req, res) => {
    // Get details from frontend(username, password) -> req.body
    // Validate the details(Not empty)
    // check if user exists
    // Find the user
    // Check password
    // Generate Access token and refresh token
    // Send cookies of Access token and refresh token
    // save the refresh token in db
    // Check for successful login
    // Return response

    const {username, password} = req.body;
    console.log(username);

    if(!username || !password){
        throw new ApiError(400, "Username & password are required");
    }

    const user = await User.findOne({username});
    if(!user){
        throw new ApiError(404, "User does not exist");
    }
    
    const isPwasswordValid = await user.isPasswordCorrect(password);
    
    if(!isPwasswordValid){
        throw new ApiError(401, "Invalid Credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    );



});

const logoutUser = asyncHandler(async (req, res) => {
    // Find the user through the access token that is in the request cookie usinng middleware
    // After verifying the token. just delete the refresh token from the database

    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(

        new ApiResponse(
            200,
            {},
            "User logged out"
        )
    );


});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshtoken = req.cookies?.refreshToken || req.body.refreshToken;
    if(!incomingRefreshtoken){
        throw new ApiError(401, "Unauthorized Request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshtoken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token");
        }
    
        if(incomingRefreshtoken!== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used");
        }
    
    
        const options = {
            httpOnly: true,
            secure: true
        };
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken},
                "Access Token refreshed"
            )
        );

    } catch (error) {
        throw new ApiError(401, error?.message || "Bad Request" ) 
    }

});

const changeCurrentPassword = asyncHandler(async (req, res)=>{
    const {oldPassword, newPassword} = req.body;

    if(oldPassword===newPassword){
        throw new ApiError(401, "Old password same as new password");
    }

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid Password");
    }

    user.password = newPassword;

    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    );

});

const getCurrentUser = asyncHandler(async(req, res)=>{
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "User details sent successfully")
    );
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullName, email} = req.body;

    const updateFields = {};

    if (typeof fullName === "string" && fullName.trim()) {
        updateFields.fullName = fullName.trim();
    }

    if (typeof email === "string" && email.trim()) {
        updateFields.email = email.trim().toLowerCase();
    }


    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "Provide fullName or email to update");
    }
    

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set: updateFields},
        {new:true, runValidators: true}
    )
    .select(
        "-password -refreshToken"
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated successfully")
    );

});

const updateUserAvatar = asyncHandler(async (req, res)=>{
    // Accept image
    // Validate user
    // Upload to Cloudinary and update in db
    // Return response

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiError(500, "Error uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set:{ avatar: avatar.url }
        },
        {new: true}
    )
    .select(
        "-password -refreshToken"
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated")
    );


});

const updateUsercoverImage = asyncHandler(async (req, res)=>{
    // Accept image
    // Validate user
    // Upload to Cloudinary and update in db
    // Return response

    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage){
        throw new ApiError(500, "Error uploading cover");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set:{ coverImage: coverImage.url }
        },
        {new: true}
    )
    .select(
        "-password -refreshToken"
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated")
    );


});

export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage
};
