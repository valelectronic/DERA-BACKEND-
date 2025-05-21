
import User from '../models/user.model.js'; // Import the User model
import jwt from 'jsonwebtoken'; // Import the jsonwebtoken library
import {redis} from "../lib/redis.js"


// Function to generate access and refresh tokens
// This function will be called to generate tokens for the user
// It will create a JWT token for the user and return it
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET,
         { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET,
         { expiresIn: '7d' });
    return { accessToken, refreshToken };

}

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', 60 * 60 * 24 * 7); // Store the refresh token in Redis with a TTL of 7 days

}
// Function to set cookies for access and refresh tokens
// This function will be called to set the cookies in the response
const setCookies = (res, accessToken, refreshToken) => {
    // Set the refresh token in an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, //prevents client-side JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // helps prevent CSRF attacks
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
}


// for signing up a user
// This function will be called when the user wants to sign up
// It will create a new user in the database and send a response back to the client
export const signUp = async(req, res) => {
const { name, email, password } = req.body;
try {
    
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please fill all fields" });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }
    // Create new user
    const newUser = new User({ name, email, password });
    await newUser.save();

    //authenticate user
    
    const {accessToken, refreshToken} = generateTokens(newUser._id)
    // Generate access and refresh tokens
    await storeRefreshToken(newUser._id, refreshToken)
    // Store the refresh token in cookie
     setCookies(res, accessToken, refreshToken)

    res.status(201).json({user:{
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
    }, message: "User created successfully" })

} catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ message: error.message });
    
}


    
}

// Function to log in a user
// This function will be called when the user wants to log in
export const logIn = async(req, res) => {
    try {
		const { email, password } = req.body;

        // Validate input
        if (!email || !password) { 
            return res.status(400).json({ message: "Please fill all fields" });
        }
        // Check if user exists
		const user = await User.findOne({ email });

		if (user && (await user.comparePassword(password))) {
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);

			res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			});
		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
    
}

// Function to log out the user
// This function will be called when the user wants to log out
export const logOut = async(req, res) => {
    try {
		const refreshToken = req.cookies.refreshToken;
		if (refreshToken) {
			const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
			await redis.del(`refresh_token:${decoded.userId}`);
		}

		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
    
}
 
// Function to refresh the access token using the refresh token
// This function will be called when the user wants to refresh their access token
// It will verify the refresh token, generate a new access token, and send it back to the client
export const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token provided" });
		}

        // Verify the refresh token
		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      

        // Check if the refresh token exists in Redis
        if (!storedToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }
        // Check if the refresh token is valid and matches the one stored in Redis
		if (storedToken !== refreshToken) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

        // Generate new access token
		const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 15 * 60 * 1000,
		});

		res.json({ message: "Token refreshed successfully" });
	} catch (error) {
		console.log("Error in refreshToken controller", error.message);
        if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }
    
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const profile = async(req, res) => {
   try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
