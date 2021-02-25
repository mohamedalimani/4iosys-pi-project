let mqtt = require('mqtt')
const mongoose = require('mongoose')


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
    temp: [], // list of objects containg sensor data and timestamp
    hum: [],  // ...
    vib: [],  // ...
    location: [], // ...
    accel: []    // ...
  }
});

const eventSchema = new mongoose.Schema({
  containerRef: String,
  data: [] // list of objects containing event type and event timestamp
});

// Models
const Measurement = mongoose.model('Measurement', measurementSchema);
const Event = mongoose.model('Event', eventSchema);



Measurement.find({}, {"_id": 0, "containerRef": 1}, (err, docs)=>{ // get containers refs 
  console.log(`Found docs: ${docs}`);
  let containerRefs = [];
  docs.forEach((el)=>{
    containerRefs.push(el["containerRef"])
    console.log(`found refs => ${containerRefs}`)
  });
  setupMQTT();
  setupSubscriptions(containerRefs);

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
  client.on('message', (topic, message, packet) => {
    console.log(`[received] Topic: ${topic}, Message:${message}, Packet:${packet}`);
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


