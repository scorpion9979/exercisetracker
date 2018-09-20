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
  log: [{description: String, duration: Number, date: Date, _id: false}]
},
{
  usePushEach: true
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
      res.send("username already taken");
    }
  });
});

app.get("/api/exercise/users", function (req, res) {
  Model.find({}, function (err, docs) {
    let response = [];
    docs.forEach(doc => {
      response.push({_id: doc._id, username: doc.username});
    });
    if(err) {
      console.log(err);
    } else {
      res.send(response)
    }
  })
});

app.post("/api/exercise/add", function (req, res) {
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = parseInt(req.body.duration);
  let date = req.body.date?new Date(req.body.date):new Date();
  Model.findOne({_id: userId}, function (err, doc) {
    if(doc == null) {
      res.send("unknown _id");
    } else {
      if(!description) {
        res.send("Path `description` is required.");
      } else if(!duration) {
        res.send("Path `duration` is required.");
      } else {
        doc.log.push({description: description, duration: duration, date: date});
        doc.count++;
        doc.save(function (err, doc) {
          if(err) {
            console.log(err);
          } else {
            res.send({_id: doc._id, username: doc.username, description: doc.log[doc.count-1]["description"],
                      duration: doc.log[doc.count-1]["duration"], date: doc.log[doc.count-1]["date"].toDateString()});
          }
        })
      }
    }
  });
});

app.get("/api/exercise/log", function (req, res) {
  let userId = req.query.userId,
      from = req.query.from?new Date(req.query.from):null,
      to = req.query.to?new Date(req.query.to):null,
      limit = req.query.limit?parseInt(req.query.limit):null;
  Model.findOne({_id: userId}, function (err, doc) {
    if(doc == null) {
      // user doesn't exist
      res.send("unknown userId");
    } else {
      // user exists
      let dateBound = 8640000000000000;
      let filteredLog = doc.log.filter(e=>e.date >= (from?from:new Date(-dateBound)) &&
                                          e.date <= (to?to:new Date(dateBound)))
                                .map(e=>({description: e.description, duration: e.duration, date: e.date.toDateString()}))
                                .slice(0, limit?limit:doc.log.length);
      let response = {_id: doc._id, username: doc.username,
                      from: from?from.toDateString():null,
                      to: to?to.toDateString():null,
                      count: filteredLog.length,
                      log: filteredLog};
      res.send(JSON.stringify(response, (k, v)=>{if(v) return v;}));
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
