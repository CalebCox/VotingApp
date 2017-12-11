const express   = require('express'),
      router    = express.Router(),
      ObjectId  = require('mongodb').ObjectID,
      Poll      = require('../models/poll');


// Index - Display all polls
router.get('/', (req, res) => {
    // find all polls
    Poll.find({}, (err, allPolls) => {
        if (err) {
            console.log(err);
        } else {
            // if all polls was successful also find all polls and order by most recent.
            Poll.find().sort({ 'creationDate': -1}).limit(10).exec((err, recentPolls) => {
                if (err) {
                    console.log(err);
                } else {
                    // if recent polls was successful, also find and sort polls based on popularity.
                    Poll.find().sort({ 'totalVotes': -1}).limit(10).exec((err, popularPolls) => {
                        res.render('polls/index', {polls: allPolls, recent: recentPolls, popular: popularPolls, currentUser: req.user});
                    });
                }
            });
        };
    });
});

// Create - Add new poll to DB
router.post('/', (req, res) => {
    var question = req.body.question;
    var optionsList = req.body.options.split(/\n/);
    var creator = {
        id: req.user._id,
        username: req.user.username
    };
    var totalVotes = 0;
    var options = [];

    for (var i=0; i < optionsList.length; i++) {
        // only push options that contain non-whitespace characters
        if (/\S/.test(optionsList[i])) {
            // Push separate options objects to pollOptions within poll schema.
            options.push({ option: optionsList[i].trim(), tally: 0 });
        }        
    }

    var newPoll = {question: question, totalVotes: totalVotes, pollOptions: options, creator: creator}

    Poll.create(newPoll, (err, newlyCreated) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/polls');
        }
    });
});

// New - Form to add new poll
router.get('/new', (req, res) => {
    res.render('polls/new');
});

// Show - Show selected poll info
router.get('/:id', (req, res) => {
    Poll.findById(req.params.id).exec((err, foundPoll) => {
        if (err) {
            console.log(err);
        } else {
            res.render("polls/show", {poll: foundPoll});
        };
    });
});

// Show My Polls - Show polls created by signed in user
router.get('/polls/mypolls', (req, res) => {
    res.render('polls/userpolls');
});

// Update - Update edited poll
// example update => b.polls.update({"pollOptions": {$elemMatch: {"_id": ObjectId("5a1ef162981bcaab9fb37a50")}}}, {$inc: {"pollOptions.$.tally": 5000}});
router.put('/:id', (req, res) => {
    var userChoice = req.body.polloption;
    var userOption = req.body.other;
    // if userChoice via radio button is defined, and the custom option is undefined, proceed.
    if (userChoice && !userOption) {
        Poll.findOneAndUpdate({"pollOptions": {$elemMatch: {"_id": ObjectId(userChoice)}}}, {$inc: {"pollOptions.$.tally": 1, "totalVotes": 1}}, (err, updatedPoll) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/polls/" + req.params.id);
            }
        })
        // if custom option is defined and user choice is undefined, proceed.
     } else if (userOption && !userChoice) {
        Poll.findByIdAndUpdate(req.params.id, {$push: {pollOptions: {option: userOption, tally: 1}}}, (err, updatedPoll) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/polls/" + req.params.id);
            }
        })
    } else {
        console.log("Something went wrong");
        res.redirect("/polls/" + req.params.id);
    }
});

// Destroy - Delete selected poll
router.delete('/:id', (req, res) => {
    Poll.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/polls");
        }
    });
    // res.send('Poll deleted!');
});

module.exports = router;