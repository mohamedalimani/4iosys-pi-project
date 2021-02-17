let mqtt = require('mqtt')
const WebSocket = require('ws')


// ========= WEBSOCKET ============
// websocket Server setup
const server = new WebSocket.Server({
  host:"0.0.0.0",
  port:8000
})

let sockets = []
server.on('connection', (socket) => {
  sockets.push(socket)

  socket.on('message', (msg)=>{ // differentitate between messages HERE
    if (msg == "OPEN"){console.log("I HAVE TO OPEN");client.publish("command/123", "OPEN");}
    if (msg == "CLOSE"){console.log("I HAVE TO CLOSE");client.publish("command/123", "CLOSE");}
    sockets.forEach( s => s.send(msg));
    console.log("[Socket Server Received] " + msg);
  })
  socket.on('close', ()=>{
    sockets.filter( s => s !== socket)
  })
})

// =================================


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


// let delay = 5000 // 5s
// setInterval(()=>{client.publish(/*...*/)}, delay)

// PUBLISH
console.log("publishing");
function publish(topic, message) {
  if(client.connected == true) { // check if connected
    client.publish(topic, message)
    console.log("published message");
  } else {
    console.log("NOT CONNECTED");
  }
}

// let timer = setInterval(()=>{publish("advertise","9999");publish("state/9999", "AOK")}, 3000)


// SUBSCRIBE
console.log("subscribing");
let subTopic=""
let subTopics = ["advertise", "state/123", "command/123", "temp/123"]
client.subscribe(subTopics, {qos:1})

// RECEIVE
console.log("receiving");
client.on('message', (topic, message, packet) => {
  console.log(`[received] Topic: ${topic}, Message:${message}, Packet:${packet}`);
  console.log("|rerouting to sockets|");
 // sockets.forEach( s => s.send(`|From Mqtt Server| [Topic]:${topic}, \n[Message]:${message}`))
  sockets.forEach( s => s.send(JSON.stringify({topic: topic, data:String(message)})))
})



// terminate connection
// client.end()

