var express			= require("express"),
	app				= express(),
	bodyParser		= require("body-parser"),
	mongoose		= require("mongoose"),
	flash			= require("connect-flash"),
	passport		= require("passport"),
	localStrategy	= require("passport-local"),
	expressSession	= require("express-session"),
	methodOverride	= require("method-override")
	



var Blog			= require("./models/blog.js"),
	Comment			= require("./models/comment.js"),
	User			= require("./models/user.js")
	  

var indexroutes		= require("./routes/index.js"),
	blogroutes		= require("./routes/blogs.js"),
	commentroutes	= require("./routes/comments.js")

	


//APP CONFIG
mongoose.connect("mongodb://localhost:27017/game_blog",{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true})
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs")
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/semantic"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');
require('dotenv').config();


//PASSPORT CONFIG
app.use(expressSession({
	secret: "I am a web developer",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	res.locals.success=req.flash("success");
	res.locals.error=req.flash("error");
	next();
});
	  
	  

//ROUTES	  
app.use (indexroutes);
app.use (blogroutes);
app.use (commentroutes);

app.listen (process.env.PORT || "3000", function(){
  console.log("server is running...")
});
