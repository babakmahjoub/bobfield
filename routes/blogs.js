var   express			= require("express"),
	  router			= express.Router(),
	  Blog				= require("../models/blog.js"),
	  middleware		= require("../middleware/index.js");


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
router.get("/blogs",function(req,res){
	var perPage = 6;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	Blog.find({}).skip((perPage*pageNumber) - perPage).limit(perPage).exec(function(err, allBlogs){
		Blog.count().exec(function(err, count){
			if (err){
				console.log(err);
			} else {
				res.render("blogs/index",{blogs:allBlogs,current: pageNumber,pages: Math.ceil(count / perPage)});
			}	
		});	
	});
});

router.get("/blogs/new", middleware.isLoggedIn,function(req,res){
		res.render("blogs/new")
});



router.post("/blogs", middleware.isLoggedIn, upload.single('image'),async function(req,res){
	if(!req.file){
		image 	= req.body.image;
		imageId = "link"
	} else {
		try {
			var result = await cloudinary.v2.uploader.upload(req.file.path);    
			image 	= result.secure_url;
			imageId = result.public_id;
		} catch (error) {
			return res.redirect("/")
		}
	};
	title	= req.body.title;
	body	= req.body.body;
	author 	= {
		id: req.user._id,
		username: req.user.username
	};
	blog = {title:title,body:body,author:author,image:image,imageId:imageId};
	Blog.create(blog, function(err,newBlog){
		req.flash('success', 'Created a blog!');
		res.redirect("/blogs")
});
})





router.get("/blogs/:id", function(req,res){
	Blog.findById(req.params.id).populate("comments").exec(function(err,foundBlog){
		res.render("blogs/show",{blog:foundBlog})
	});
})

router.get("/blogs/:id/edit", middleware.blogOwnership, function(req,res){
	Blog.findById(req.params.id, function(err,foundBlog){
		res.render("blogs/edit",{blog:foundBlog})
	})
});

router.put("/blogs/:id", middleware.blogOwnership, function(req,res){
	Blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err,updatedBlog){
		req.flash('success', 'Blog edited successfully!');
		res.redirect("/blogs/"+req.params.id)
	})
});

router.delete("/blogs/:id", middleware.blogOwnership, function(req,res){
	Blog.findByIdAndRemove(req.params.id,function(err){
		req.flash('success', 'Blog Deleted!');
		res.redirect("/blogs")
	})
});


module.exports = router;