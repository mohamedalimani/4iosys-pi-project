let mqtt = require('mqtt')
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000
const {Measurement,Event, Registry} = require('./resources/container.models')
const containerRouter = require('./resources/container.router')
const notificationRouter = require('./resources/notification.router')


// ========= MQTT ==============

// mqtt setup 
//const IP = "192.168.1.13";
const IP = "0.0.0.0";
const PORT ="1883";
const ENDPOINT = `mqtt://${IP}:${PORT}`;
let subTopic=""
let subTopics = ["gaz", "flame", "temp", "light","door"]
let client = {}

// connection options (optional)
let options = {
  clientId:"mqttjs01",
  username:"steve",
  password:"password",
  clean:true
};



// ========== MONGO =============
mongoose.connect('mongodb://localhost:27017/containers', { useNewUrlParser: true,  useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error'))
// call once on connection open
db.once('open', ()=> {
  console.log('Connected to database')
}); 


// Get all predefined containers and subscribe to their channels (where they report data according to standardized channel naming schema) 
Registry.find({}, {"_id": 0, "containerRef": 1}, (err, docs)=>{ // get containers refs 
  console.log(`Found docs: ${docs}`);
  let containerRefs = [];
  docs.forEach((el)=>{
    containerRefs.push(el["containerRef"])
    console.log(`Found containers => ${containerRefs}`)
  });
  setupMQTT();
  setupSubscriptions(containerRefs);
  
  // 
  app.use(cors());
  app.use(express.json())
  app.use('/container', containerRouter);
  app.use('/notification', notificationRouter);


  // OLD TESTING SCENARIO
  // console.log("UPDATING")
  /*Measurement.updateOne(
    {containerRef: '123'},
    {$push: {"data.$.temp": [22]}},
    (err, res)=> {
      if (err) console.log(`Error: ${err}`);
      console.log(`update result ${JSON.stringify(res)}`)
    }
  ).then(()=>{
    // Webservice
    app.get('/allContainers', (req, res) => {
      Measurement.find({}, {"_id": 0, "containerRef": 1}, (err, docs)=>{
        res.json(docs);
      })
      //res.send('Hello World!')
    })

    // Webservice
    app.get('/measurements/:containerId', (req, res) => {
      Measurement.findOne({"containerRef": req.params.containerId}, (err, docs)=>{
        res.json(docs);
      })
      //res.send('Hello World!')
    })

    

    app.listen(3000, "0.0.0.0", () => {
      console.log(`Express app listening at http://0.0.0.0:${port}`)
    })
    
  });*/

  

  app.listen(3000, "0.0.0.0", () => {
    console.log(`Express app listening at http://0.0.0.0:${port}`)
  })

}) /* .select({"_id":0, "data":0, "containerRef":1}, */



// HELPER functions 

let setupMQTT = () => {
   client = mqtt.connect(ENDPOINT)


  console.log("starting client");

  // on CONNECT
  client.on('connect', ()=>{
    console.log("Connected to MQTT broker successfuly");
  })

  // ON ERROR
  client.on('error', (err)=>{
    console.log(`Error ${err}`);
  })


  // let timer = setInterval(()=>{publish("advertise","9999");publish("state/9999", "AOK")}, 3000)


  // measurements topics, maybe recover all containerRefs from db and subscribe based on them to sensor topics

  // RECEIVE
  // console.log("receiving");

  client.on('message', (topic, message, packet) => { // save data to db depending on data type/containerRef
    // console.log(`[Received] Topic: ${topic}, Message:${message}, Packet:${packet}`);
    console.log(`[Received] Topic: ${topic}, Value:${message}`);
    const contRef = topic.split('/')[0];
    // do a rigged container data update
    if(topic.includes("temp")) {
      Measurement.updateOne(
        {containerRef: contRef},
        {$push: {
          "data.temp": {
            $each: [{value:parseInt(message), time:new Date().toISOString()}],
            $position: 0 // Insert at the begging of the array
          }
        }},
        (err, res)=> {
          if (err) console.log(`Error: ${err}`);
          // console.log(`update result ${JSON.stringify(res)}`);
          console.log("[Updated] TEMPERATURE data")
        }
      );
    }// do temp update
    else if(topic.includes("flame")) {
      Measurement.updateOne(
        {containerRef: contRef},
        {$push: {
          "data.flame": {
            $each: [{value:parseInt(message), time:new Date().toISOString()}],
            $position: 0 // Insert at the begging of the array
          }
        }},
        (err, res)=> {
          if (err) console.log(`Error: ${err}`);
          // console.log(`update result ${JSON.stringify(res)}`)
          console.log("[Updated] FLAME data")
        }
      );
    }// do hum update
    else if (topic.includes("gaz")) {
      Measurement.updateOne(
        {containerRef: contRef},
        {$push: {
          "data.gaz": {
            $each: [{value:parseInt(message), time:new Date().toISOString()}],
            $position: 0 // Insert at the begging of the array
          }
        }},
        (err, res)=> {
          if (err) console.log(`Error: ${err}`);
          // console.log(`update result ${JSON.stringify(res)}`)
          console.log("[Updated] GAZ data")
        }
    // do gaz update
    )
  }

  else if (topic.includes("light")) {
    Measurement.updateOne(
      {containerRef: contRef},
      {$push: {
        "data.light": {
          $each: [{value:parseInt(message), time:new Date().toISOString()}],
          $position: 0 // Insert at the begging of the array
        }
      }},
      (err, res)=> {
        if (err) console.log(`Error: ${err}`);
        // console.log(`update result ${JSON.stringify(res)}`)
        console.log("[Updated] LIGHT data")
      }
  // do gaz update
  )
}

else if (topic.includes("door")) {
  Measurement.updateOne(
    {containerRef: contRef},
    {$push: {
      "data.door": {
        $each: [{value:parseInt(message), time:new Date().toISOString()}],
        $position: 0 // Insert at the begging of the array
      }
    }},
    (err, res)=> {
      if (err) console.log(`Error: ${err}`);
      // console.log(`update result ${JSON.stringify(res)}`)
      console.log("[Updated] DOOR data")
    }
)
// ------
Registry.updateOne(
  {containerRef: contRef},
  {$set: {
    "door": parseInt(message) == 1?true:false  // true/1 -> pushed (door closed), 0/false a-> not pushed (door opened)
  }},
  (err, res) => {
    if (err) console.log(`Error: ${err}`);
    else console.log("[Update] DOOR status set")
  }
)
}

})


}

function setupSubscriptions (containersRefs) {
  // SUBSCRIBE
  // console.log("subscribing");
  containersRefs.forEach((cont) => { // all containers
    subTopics.forEach((topic) => { // subscribe to needed subchannels
      const channel = `${cont}/${topic}`;
      client.subscribe(channel, {qos: 1});
      console.log(`[Subscription] ${channel} Channel`);
    })
  })

}

// ======== EXPRESS ==========




module.exports = app;