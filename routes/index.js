var   express			= require("express"),
	  router			= express.Router(),
	  passport			= require("passport"),
	  User				= require("../models/user"),
	  Blog				= require("../models/blog"),
	  async				= require("async"),
	  nodemailer		= require("nodemailer"),
	  crypto			= require("crypto")



router.get ("/", function(req,res){
  res.render("landing")
});


router.get("/register", function(req,res){
	res.render("users/register")
})


router.post("/register",function(req,res){
	var newUser = new User(req.body);
	User.register(newUser, req.body.password, function(err,user){
		passport.authenticate("local")(req,res,function(){
			res.redirect("/blogs")
		});
	});
});


router.get("/login",function(req,res){
	res.render("users/login")
});


router.post("/login",passport.authenticate("local",{
	successRedirect: "/blogs",
	failureRedirect: "/login"
}),function(req,res){

});


router.get("/logout",function(req,res){
	req.logout();
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
					// flash msg
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
					user:"babak.mahjoub@gmail.com",
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
				// flsh msg
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
		// req.flash('error', 'Password reset token is invalid or has expired.');
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
			// req.flash('error', 'Password reset token is invalid or has expired.');
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
			//   req.flash("error", "Passwords do not match.");
			  return res.redirect('back');
		  }
		});
	  },
	  function(user, done) {
		var smtpTransport = nodemailer.createTransport({
		  service: 'Gmail', 
		  auth: {
			user: 'babak.mahjoub@gmail.com',
			pass: process.env.GMAILPW
		}
		});
		var mailOptions = {
		  to: user.email,
		  from: 'babak.mahjoub@mail.com',
		  subject: 'Your password has been changed',
		  text: 'Hello,\n\n' +
			'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
		};
		smtpTransport.sendMail(mailOptions, function(err) {
		//   req.flash('success', 'Success! Your password has been changed.');
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

router.put("/users/:id/edit", function(req,res){
	var firstName	= req.body.firstName,
		lastName	= req.body.lastName,
		avatar		= req.body.avatar
	var user		= {firstName:firstName, lastName:lastName, avatar:avatar}	
	User.findByIdAndUpdate(req.params.id,user,function(err,editedUser){
			res.redirect("/users/"+ req.params.id)
	});
});


module.exports = router;