const express = require('express');
const app = express();
const mongoose = require('mongoose'); // adding mangoose                                                         
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + "/static")); // set static folder for htmle and css
app.set('views', __dirname + '/views'); // set location for ejs
app.set('view engine', 'ejs'); // set ejs views engine
mongoose.connect('mongodb://localhost/message_dashboad'); // / connecting mongoose to database called message_dashboard

// ─── END OF DEPENDENCIES ────────────────────────────────────────────────────────
//A Mongoose model is a wrapper on the Mongoose schema. A Mongoose schema defines the structure of the document, default values, validators, etc., whereas a Mongoose model provides an interface to the database for creating, querying, updating, deleting records, etc.
const Schema = mongoose.Schema;
const MessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 4
    },
    message: {
        type: String,
        required: true
    },
    _comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, {
    timestamps: true
});
const CommentSchema = new mongoose.Schema({
    _message: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    },
    name: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});
// ─── END OF SETTING UP SCHEMAS FOR MONGODB ──────────────────────────────────────
// Creating the models and naming them as variables
// for ease
mongoose.model('Message', MessageSchema);
mongoose.model('Comment', CommentSchema);
const Message = mongoose.model('Message');
const Comment = mongoose.model('Comment');
mongoose.Promise = global.Promise;
// ─── END OF MODEL CREATION ──────────────────────────────────────────────────────
// This populates the root route with messages and their comments
// this route will render message and comments on index.ejs page
app.get("/", function (req, res) {
    Message.find({}).populate('_comments').exec(function (err, results) {
        console.log(results);
        res.render('index.ejs', {
            messages: results
        });
    });
});
// This adds a message into the database if it has passed validations
// Otherwise it displays an error
app.post("/post", function (req, res) {
    const newMessage = new Message({
        name: req.body.name,
        message: req.body.message
    });
    newMessage.save(function (err) {
        if (err) {
            console.log("Message cannot be posted. See below for errors:")
            console.log(err);
            res.redirect("/")
        } else {
            console.log("Message posted.");
            res.redirect('/');
        }
    })
});

// This section allows for a user to comment on someones post/message
// It uses the id in the root parameter to identify which post/message
// the comment is associated with
// As usual, it will add the comment to the database if it passes validations
// and will redirect to the main root where the new comment will be visible

app.post("/comment/:id", function(req, res){
	Message.findOne({_id: req.params.id}, function(err, message){
		const newComment = new Comment({name: req.body.name, comment: req.body.comment});
		newComment._message = message._id;
        console.log(message);
		Message.update({_id: req.params.id}, {$push: {_comments: newComment}}, function(err){
            if(err){
                console.log("Error occurred. See below:");
                console.log(err);
                res.redirect("/");
            }
		});
		newComment.save(function(err){
			if(err){
                console.log("Commenting unsuccessful. See below for errors:")
				console.log(err);
		        res.redirect("/");
			} else {
				console.log("Successfully commented");
				res.redirect("/");
			}
		});
	});
})

app.listen(8000, function () {
    console.log("listening on port 8000");
});


// Notes : WHen i Post message, the database gets automatically created. We can check from our mongo server terminal. type show dbs>>type use name>>show collections>> type db.collection_name.find().pretty()