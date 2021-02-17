let mqtt = require('mqtt')




// ========= MQTT ==============

// mqtt setup 
//const IP = "192.168.1.13";
const IP = "0.0.0.0";
const PORT ="1883";
const ENDPOINT = `mqtt://${IP}:${PORT}`;


let options = {
  clientId:"mqttjs01",
  username:"steve",
  password:"password",
  clean:true
};



let client = mqtt.connect(ENDPOINT)


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


// SUBSCRIBE
console.log("subscribing");
let subTopic=""
let subTopics = ["gaz", "flame", "temp"]
client.subscribe(subTopics, {qos:1})

// RECEIVE
console.log("receiving");
client.on('message', (topic, message, packet) => {
  console.log(`[received] Topic: ${topic}, Message:${message}, Packet:${packet}`);
})


