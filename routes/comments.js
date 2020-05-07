var   express			= require("express"),
	  router			= express.Router(),
	  middleware		= require("../middleware/index.js"),
	  Blog				= require("../models/blog.js"),
	  Comment			= require("../models/comment.js")



// Plan A:
router.post("/blogs/:id/comments",middleware.isLoggedIn,function(req,res){
	Blog.findById(req.params.id,function(err,foundBlog){
		var text	= req.body.text
			author	= {
				id : req.user._id,
				username: req.user.username,
				firstName: req.user.firstName,
				lastName: req.user.lastName,
				avatar: req.user.avatar
			}
			comment = {text:text, author:author}
		Comment.create(comment,function(err, comment){
			foundBlog.comments.push(comment)
			foundBlog.save();
			req.flash('success', 'Created a comment!');
			res.redirect("/blogs/" + foundBlog._id )
		})
	})
});

// Plan B:
// router.post("/blogs/:id/comments",middleware.isLoggedIn,function(req,res){
// 	Blog.findById(req.params.id,function(err,foundBlog){
// 		Comment.create(req.body.comment,function(err, comment){
// 			comment.author.id = req.user._id,
// 			comment.author.username = req.user.username
// 			comment.save()

// 			foundBlog.comments.push(comment)
// 			foundBlog.save()
// 			res.redirect("/blogs/" + foundBlog._id )
// 		})
// 	})
// });



// Plan A:
router.put("/blogs/:id/comments/:comment_id",middleware.commentOwnership,function(req,res){
	var text	= req.body.text
		comment	= {text:text}
	Comment.findByIdAndUpdate(req.params.comment_id,comment,function(err, updatedComment){
		req.flash('success', 'Comment edited successfully!');
		res.redirect("/blogs/" + req.params.id)
	})
});

// Plan B:
// router.put("/blogs/:id/comments/:comment_id",middleware.commentOwnership,function(req,res){
// 	Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err, updatedComment){
// 		res.redirect("/blogs/" + req.params.id)
// 	})
// });

router.delete("/blogs/:id/comments/:comment_id",middleware.commentOwnership,function(req,res){
	Comment.findByIdAndRemove(req.params.comment_id,function(err){
		req.flash('success', 'Comment Deleted!');
		res.redirect("/blogs/" + req.params.id)
	});
	
});



module.exports = router;