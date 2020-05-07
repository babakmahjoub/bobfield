var Blog        = require("../models/blog.js"),
    Comment     = require("../models/comment.js");

var middlewareObj = {};

middlewareObj.isLoggedIn = function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","Please Login First");
    res.redirect("/login") 
}   

middlewareObj.blogOwnership = function(req,res,next){
    if(req.isAuthenticated()){
        Blog.findById(req.params.id,function (err, foundBlog){
            if(foundBlog.author.id.equals(req.user._id)){
                return next();
            }
            req.flash("error","You do not have permission to perform this action");
            res.redirect("/blogs/"+ req.params.id)
        });
    } else {
        req.flash("error","Please Login First");
        res.redirect("/login")
    };
};

middlewareObj.commentOwnership = function(req,res,next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function (err, foundComment){
            if(foundComment.author.id.equals(req.user._id)){
                return next();
            }
            req.flash("error","You do not have permission to perform this action");
            res.redirect("/blogs/" + req.params.id)
        });
    } else {
        req.flash("error","Please Login First");
        res.redirect("/login")
    }
};

module.exports = middlewareObj