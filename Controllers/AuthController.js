const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { createSecretToken } = require("../Util/SecretToken");

module.exports.signup = async (req, res) => {
    try{
        const {name, email, password, avatar, role} = req.body;
        const existingUser = await User.findOne({ email});
        if(existingUser){
            return res.json({ message: "User with this email already exists"});
        }
        const user = await User.create({ name, email, password, avatar, role: role || "user", });
        const token = createSecretToken(user._id, user.role);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
        });
        res.status(201).json({ message: "User signed up successfully", success: true, user });
    }catch(err){
        console.error(err);
    };
}

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password){
            return res.json({ message: "All fields are required" });
        }
        const user = await User.findOne({ email }).select("+password");
        if(!user){
            return res.json({ message: "Incorrect password or email" });
        }
        const auth = await bcrypt.compare(password, user.password);
        if(!auth){
            return res.json({ message: "Incorrect password or email" });
        }
        const token = createSecretToken(user._id, user.role);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
        });
        return res.status(200).json({
            message: "User logged in successfully",
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
    }
}

module.exports.logout = (req, res) =>{
    res.clearCookie("token");
    return res.status(200).json({
        message: "User logged out successfully",
        status: true
    });
};