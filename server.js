const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://scorpion9979:ahwedvcx314@ds161092.mlab.com:61092/exercisetracker' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

var Schema = mongoose.Schema;
var userSchema = new Schema({
  _id: {type: String, required: true},
  username: {type: String, required: true},
  count: {type: Number, default: 0},
  log: [{description: String, duration: Number, date: Date}]
});
var Model = mongoose.model("Model", userSchema);

app.post("/api/exercise/new-user", function (req, res) {
  let username = req.body.username;
  Model.findOne({username: username}, function (err, doc) {
    if(doc == null) {
      // user doesn't already exist
      let _id = (new mongoose.mongo.ObjectId()).toHexString();
      let user = new Model({_id: _id, username: username});
      user.save(function (err, doc) {
        if(err) {
          console.log(err);
        } else {
          res.send({_id: doc._id, username: doc.username});
        }
      });
    } else {
      // user already exist
      res.send({_id: doc._id, username: doc.username});
    }
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
