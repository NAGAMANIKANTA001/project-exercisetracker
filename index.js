const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const { response } = require('express');
require('dotenv').config()
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if (err) {
    console.log("Failed to Connect : " + err.message)
  } else {
    console.log("Connected")
  }
});
const userSchema = new mongoose.Schema({
  username:{
    type:String,
    required:true
  }
})

const excerciseSchema = new mongoose.Schema({
  userId:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  duration:{
    type:Number,
    required:true
  },
  date:{
    type:Date,
    required:true
  }
})



const User = mongoose.model('User',userSchema);
const Excercise = mongoose.model('Excercise',excerciseSchema);


app.use(cors())
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route("/api/users")
  .get((req,res)=> {
    User.find({},(err,data)=> {
      if(err) {
        res.send("Not Found");
      } else {
        res.json(data)
      }
    })
  })
  .post((req,res)=>{
  let newUser = new User({
    username:req.body.username
  })
  newUser.save((err,data)=> {
    if(err) {
      res.send("User Not Added")
    } else {
      res.json({username:data.username,_id:data._id})
    }
  })
})

app.post("/api/users/:_id/exercises",(req,res)=> {
  if(req.body.description == null || req.body.duration == null) {
    res.send("Fill Mandatory Fields")
  } else {
    User.findById(req.params._id,(err,user)=> {
      if(err || user == null) {
        res.send("Please enter valid user ID")
      } else {
        let date = new Date(req.body.date);
        if(date == null || date == "Invalid Date") {
          date = new Date()
        }
        let newExcercise = new Excercise({userId:user._id,description:req.body.description,duration:req.body.duration,date:date});
        newExcercise.save((err,exercise)=>{
          if(err) {
            res.send("Can't save the Excercise!!!")
          } else {
            res.json({
              _id:user._id,
              username:user.username,
              date:exercise.date.toDateString(),
              duration:exercise.duration,
              description:exercise.description
            })
          }
        })
      }
    })
  }
})


app.get("/api/users/:_id/logs",(req,res)=>{
  let from = req.query["from"]
  let to = req.query["to"]
  let limit = req.query["limit"]
  console.log({
    from:from,
    to:to,
    limit:limit
  })
  User.findById(req.params._id,(err,user)=> {
    if(err || user == null) {
      res.send("User Not Found")
    } else {
      let query = Excercise.find({userId:user._id}).select({description:1,duration:1,date:1})
      if(from != undefined && new Date(from) != "Invalid Date") {
        query = query.find({date:{$gte:new Date(from)}})
      }
      if(to != undefined && new Date(to) != "Invalid Date") {
        query = query.find({date:{$lt:new Date(to)}})
      }
      if(limit != undefined) {
        query = query.limit(parseInt(limit))
      }
      query.exec((err,excercises)=>{
        if(err) {
          console.log(err)
          res.send("Can't Fetch")
        } else {
          excercises = excercises.map((item)=>({description:item.description,duration:item.duration,date:item.date.toDateString()}))
          res.json({
            username:user.username,
            count:excercises.length,
            _id:user._id,
            log:excercises
          })
        }
      })
    }
  }) 
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
