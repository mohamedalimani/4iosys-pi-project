let router = require('express').Router()
const app = require('../app');
const {Notification} = require('./container.models')

  
// Webservice
router.get('/allNotifications', (req, res) => {// Registered containers
  Notification.find({},  (err, docs)=>{
    res.json(docs);
  })
  //res.send('Hello World!')
})

module.exports = router;