require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const header = req.headers.authorization;

        if(!header || !header.startsWith("Bearer")){
            return res.status(401).json({ message: "No token provided" });
        }
        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            role: decoded.role || "user",
        };

        next();

    } catch (error) {
        console.error("Auth error: ", error);
        res.status(401).json({ message: "Unauthorized or invalid token" });
    }
    // const token = req.cookies.token;
    // if (!token) {
    //     return res.json({ status: false });
    // }
    // jwt.verify(token, process.env.JWT_SECRET, async(err, data) => {
    //     if(err){
    //         return res.json({ status: false });
    //     }else{
    //         const user = await User.findById(data.id);
    //         if(user) return res.json({ status: true, user: user.username });
    //         else return res.json({ status: false });
    //     }
    // })
};