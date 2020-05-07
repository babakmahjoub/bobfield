var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type:String, unique:true, required:true},
    password: String,
    avatar: String,
    avatarId: String,
    firstName: String,
    lastName: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    

});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);