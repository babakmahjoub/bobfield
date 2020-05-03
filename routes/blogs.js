var   express			= require("express"),
	  router			= express.Router(),
	  Blog				= require("../models/blog.js")
	  middleware		= require("../middleware/index.js")


router.get("/blogs",function(req,res){
	Blog.find({},function(err,allBlogs){
		res.render("blogs/index",{blogs:allBlogs});
	})
});

router.get("/blogs/new", middleware.isLoggedIn,function(req,res){
		res.render("blogs/new")
});

router.post("/blogs", middleware.isLoggedIn, function(req,res){
	var title	= req.body.title,
		image	= req.body.image,
		body	= req.body.body,
		author 	= {
			id: req.user._id,
			username: req.user.username
		},
		blog = {title:title,image:image,body:body,author:author}	

	Blog.create(blog, function(err,newBlog){
		res.redirect("/blogs")
	})
});

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
		res.redirect("/blogs/"+req.params.id)
	})
});

router.delete("/blogs/:id", middleware.blogOwnership, function(req,res){
	Blog.findByIdAndRemove(req.params.id,function(err){
		res.redirect("/blogs")
	})
});


module.exports = router;