var   express			= require("express"),
	  router			= express.Router(),
	  passport			= require("passport"),
	  User				= require("../models/user"),
	  Blog				= require("../models/blog"),
	  async				= require("async"),
	  nodemailer		= require("nodemailer"),
	  crypto			= require("crypto")

						  require('dotenv').config();
							

//multer Setup
var multer = require('multer');
var storage = multer.diskStorage({
filename: function(req, file, callback) {
	callback(null, Date.now() + file.originalname);
}
});
var imageFilter = function (req, file, cb) {
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

//Cloudinary Setup
var cloudinary = require('cloudinary');
cloudinary.config({ 
cloud_name: 'yourmedia', 
api_key: process.env.CLOUDINARY_API_KEY, 
api_secret: process.env.CLOUDINARY_API_SECRET
});

//ROUTES
router.get ("/", function(req,res){
  res.render("landing")
});


router.get ("/quiz", function(req,res){
	res.render("quiz")
})

router.get("/register", function(req,res){
	res.render("users/register")
})


router.post("/register", upload.single('avatar'),function(req,res){
	cloudinary.uploader.upload(req.file.path, function(result) {
		req.body.avatar=result.secure_url;
		req.body.avatarId=result.public_id;
		var newUser = new User(req.body);
		User.register(newUser, req.body.password, function(err,user){
			if(err){
				req.flash("error",err.message);
				return res.redirect("/blogs")
			}
			passport.authenticate("local")(req,res,function(){
				req.flash("success","Successfully registered, Welcome " + user.firstName);
				res.redirect("/blogs")
			});
		});
	});
});


router.get("/login",function(req,res){
	return res.render("users/login")
});


router.post("/login",passport.authenticate("local",{
	successRedirect: "/blogs",
	failureRedirect: "/login",
	successFlash:"Welcome back ",
	failureFlash: true,
}),function(req,res){

});


router.get("/logout",function(req,res){
	req.logout();
	req.flash("success","Logged you out!");
	res.redirect("/blogs")
});

router.get("/forgot",function(req,res){
	res.render("users/forgot")
});

router.post("/forgot",function(req,res,next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString("hex");
				done(err, token);
			});
		},
		function(token, done){
			User.findOne({username:req.body.username}, function(err, user){
				if (!user){
					req.flash("error","Can not find this username");
					return res.redirect("/forgot");
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 360000; //1 hour

				user.save(function (err){
					done (err, token, user);
				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service: "Gmail",
				auth: {
					user:process.env.GMAILUS,
					pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.username,
				from: "babak.mahjoub@gmail.com",
				subject: "Password Reset",
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' + 
				'Please click on the following link, or paste this into your browser to complete the process:\n\n' + 
				'http://' + req.headers.host + '/reset/' + token + '\n\n' + 
				'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err){
				console.log("mail sent");
				req.flash("success","A password reset link has been sent to your email account");
				done(err, "done");
			});
		},

	], function(err){
		if (err) return next (err);
		res.redirect("/forgot")
	});
});

router.get('/reset/:token', function(req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
	  if (!user) {
		req.flash('error', 'Password reset token is invalid or has expired.');
		return res.redirect('/forgot');
	  }
	  res.render('users/reset', {token: req.params.token});
	});
  });
  
  router.post('/reset/:token', function(req, res) {
	async.waterfall([
	  function(done) {
		User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		  if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('back');
		  }
		  if(req.body.password === req.body.confirm) {
			user.setPassword(req.body.password, function(err) {
			  user.resetPasswordToken = undefined;
			  user.resetPasswordExpires = undefined;
  
			  user.save(function(err) {
				req.logIn(user, function(err) {
				  done(err, user);
				});
			  });
			})
		  } else {
			req.flash("error", "Passwords do not match.");
			  return res.redirect('back');
		  }
		});
	  },
	  function(user, done) {
		var smtpTransport = nodemailer.createTransport({
		  service: 'Gmail', 
		  auth: {
			user: process.env.GMAILUS,
			pass: process.env.GMAILPW
		}
		});
		var mailOptions = {
		  to: user.username,
		  from: process.env.GMAILUS,
		  subject: 'Your password has been changed',
		  text: 'Hello,\n\n' +
			'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
		};
		smtpTransport.sendMail(mailOptions, function(err) {
		req.flash('success', 'Success! Your password has been changed.');
		  done(err);
		});
	  }
	], function(err) {
	  res.redirect('/blogs');
	});
  });
  


router.get("/users/:id", function(req,res){
	User.findById(req.params.id,function(err,foundUser){
		Blog.find({"author.id":foundUser._id}).exec(function(err,userBlogs){
			res.render("users/show", {user:foundUser,blogs:userBlogs });
		})
	});
});


router.get("/users/:id/edit", function(req,res){
	User.findById(req.params.id,function(err,foundUser){
			res.render("users/edit")
		});
});

router.put("/users/:id/edit", upload.single("avatar"),function(req,res){
	
	User.findById(req.params.id,async function(err,editedUser){
		if(req.file){
			try {
				await cloudinary.v2.uploader.destroy(editedUser.avatarId);
				var result = await cloudinary.v2.uploader.upload(req.file.path);
				editedUser.avatar = result.secure_url;
				editedUser.avatarId = result.public_id;
			} catch (error) {
				return res.redirect("/blogs");
			}
		}
		editedUser.firstName = req.body.firstName;
		editedUser.lastName = req.body.lastName;
		editedUser.save();
		res.redirect("/users/"+ req.params.id)
	});
});





module.exports = router;