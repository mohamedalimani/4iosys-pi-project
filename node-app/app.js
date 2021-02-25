let mqtt = require('mqtt')
const mongoose = require('mongoose')
const express = require('express')
const app = express()
const port = 3000


// ========= MQTT ==============

// mqtt setup 
//const IP = "192.168.1.13";
const IP = "0.0.0.0";
const PORT ="1883";
const ENDPOINT = `mqtt://${IP}:${PORT}`;
let subTopic=""
let subTopics = ["gaz", "flame", "temp"]
let client = {}

// connection options (optional)
let options = {
  clientId:"mqttjs01",
  username:"steve",
  password:"password",
  clean:true
};



// ========== MONGO =============
mongoose.connect('mongodb://192.168.1.14:27017/containers', { useNewUrlParser: true,  useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error'))
// call once on connection open
db.once('open', ()=> {
  console.log('Connected to database')
}); 

// SCHEMAS 
const measurementSchema = new mongoose.Schema({
  containerRef: String,
  data: {
    temp:     [],   // list of objects containg sensor data and timestamp
    gaz:      [],   // ...
    flame:    [],   // ...
    hum:      [],   // ...
    vib:      [],   // ...
    location: [],   // ...
    accel:    []    // ...
  }
});

const eventSchema = new mongoose.Schema({
  containerRef: String,
  data: [] // list of objects containing event type and event timestamp
});

// Models
const Measurement = mongoose.model('Measurement', measurementSchema);
const Event = mongoose.model('Event', eventSchema);


// Get all predefined containers and subscribe to their channels (where they report data according to standardized channel naming schema) 
Measurement.find({}, {"_id": 0, "containerRef": 1}, (err, docs)=>{ // get containers refs 
  console.log(`Found docs: ${docs}`);
  let containerRefs = [];
  docs.forEach((el)=>{
    containerRefs.push(el["containerRef"])
    console.log(`found refs => ${containerRefs}`)
  });
  setupMQTT();
  setupSubscriptions(containerRefs);
  console.log("UPDATING")
  Measurement.updateOne(
    {containerRef: '123'},
    {$push: {"data.$.temp": [22]}},
    (err, res)=> {
      if (err) console.log(`Error: ${err}`);
      console.log(`update result ${JSON.stringify(res)}`)
    }
  ).then(()=>{
    app.get('/allContainers', (req, res) => {
      Measurement.find({}, {"_id": 0, "containerRef": 1}, (err, docs)=>{
        res.json(docs);
      })
      //res.send('Hello World!')
    })


    app.listen(3000, "0.0.0.0", () => {
      console.log(`Express app listening at http://0.0.0.0:${port}`)
    })
    
  });

}) /* .select({"_id":0, "data":0, "containerRef":1}, */



// HELPER functions 

let setupMQTT = () => {
   client = mqtt.connect(ENDPOINT)


  console.log("starting client");

  // on CONNECT
  client.on('connect', ()=>{
    console.log("connected  "+client.connected);
  })

  // ON ERROR
  client.on('error', (err)=>{
    console.log(`Error ${err}`);
  })


  // let timer = setInterval(()=>{publish("advertise","9999");publish("state/9999", "AOK")}, 3000)


  // measurements topics, maybe recover all containerRefs from db and subscribe based on them to sensor topics

  // RECEIVE
  console.log("receiving");

  client.on('message', (topic, message, packet) => { // save data to db depending on data type/containerRef
    console.log(`[received] Topic: ${topic}, Message:${message}, Packet:${packet}`);
    // do a rigged container data update
    if(topic.includes("temp")) {
      Measurement.updateOne(
        {containerRef: '123'},
        {$push: {"data.temp": [parseInt(message)]}},
        (err, res)=> {
          if (err) console.log(`Error: ${err}`);
          console.log(`update result ${JSON.stringify(res)}`);
        }
      );
    }// do temp update
    else if(topic.includes("flame")) {
      Measurement.updateOne(
        {containerRef: '123'},
        {$push: {"data.flame": [parseInt(message)]}},
        (err, res)=> {
          if (err) console.log(`Error: ${err}`);
          console.log(`update result ${JSON.stringify(res)}`)
        }
      );
    }// do hum update
    else if (topic.includes("gaz")) {
      Measurement.updateOne(
        {containerRef: '123'},
        {$push: {"data.gaz": [parseInt(message)]}},
        (err, res)=> {
          if (err) console.log(`Error: ${err}`);
          console.log(`update result ${JSON.stringify(res)}`)
        }
    // do gaz update
    )
  }
})
}

function setupSubscriptions (containersRefs) {
  // SUBSCRIBE
  console.log("subscribing");
  containersRefs.forEach((cont) => { // all containers
    subTopics.forEach((topic) => { // subscribe to needed subchannels
      const channel = `${cont}/${topic}`;
      client.subscribe(channel, {qos: 1});
      console.log(`Subscribed to ${channel}`);
    })
  })

}

// ======== EXPRESS ==========




