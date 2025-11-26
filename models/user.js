const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        minLength: 6,
        select: false
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    avatar: {
        type: String,
        set: (v) => v === "" ? "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freepik.com%2Fvectors%2Fdefault-avatar&psig=AOvVaw3KCi-NZAmv6-ksOHrL-SQq&ust=1763377591743000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCNCD3crD9pADFQAAAAAdAAAAABAM" : v,
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;