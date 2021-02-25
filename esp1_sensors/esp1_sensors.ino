#include "MQ135.h"
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "OneWire.h"
#include "DallasTemperature.h"



// Communication related data
const int PUBLISH_INTERVAL = 2000;

const char* ssid = "SOC"; // Broker server Netwoek
const char* password = "12345678@hbz";  // Network pwd
const char* mqttServer ="192.168.43.121";  // Broker ip (raspi) 
const int mqttPort = 1883;  // default MQTT port 
const char* mqttUser = "";  // no credentials for now
const char* mqttPassword = "";  // no cred for now

/// Channels 
const char* GAZ_CHANNEL = "gaz";  //"state/" + ID;
const char* FLAME_CHANNEL = "flame";  //"command/" + ID;
const char* TEMPERATURE_CHANNEL = "temp"; ->   /temp²
/// client
WiFiClient espClient;
PubSubClient client(espClient);


// Sensor related data
const int flameSensor = A0 ; 
const int buzzer = 5 ;
const int temp = 4 ;
const int gaz = 16 ;
//float fs ;
float t  ; 
// TEMP sensor related data structures 
OneWire oneWire(2);
DallasTemperature tempSensor(&oneWire);



void setup(){ //====> SETUP START
  pinMode(flameSensor,OUTPUT) ;
  pinMode(temp,OUTPUT) ;
  tempSensor.begin();
  Serial.begin(9600) ;

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Connecting to Wifi ...");
  }
  Serial.println("Connected to Wifi network");

  // set server
  client.setServer(mqttServer, mqttPort);
  //client.setCallback(callback);

  while(!client.connected()){
    Serial.println("Connecting to MQTT ...");
    if(client.connect("ESP8266Client", mqttUser, mqttPassword)){
       Serial.println("connected");
    } else {
      Serial.print("failed to connect with state");
      Serial.print(client.state());
      delay(2000);
    }
  }

}// ================> SETUP END
  
void loop(){ //== ==> LOOP START
  client.loop();
  detect_flame() ;
  delay(500);
  detect_gaz() ;
  delay(500);
  detect_temperature();
  delay(PUBLISH_INTERVAL);
} // ================> LOOP END

void detect_flame(){
  float fs = analogRead(flameSensor) ;
  Serial.print("Flame: ");
  char res[8];
  dtostrf(fs, 6, 2, res);
  Serial.println(res);
  client.publish(FLAME_CHANNEL, (char*)res);
  if (fs < 200){
      alarm() ;
    }
  }
   
void alarm(){
  tone(buzzer,800) ;
  delay(200) ;
  noTone(buzzer) ; 
  delay(200) ;
}


  /* void calculate_temp(){
   t = analogRead(temp) ;
   Serial.println(t) ;
    }
    */

void detect_gaz(){
  MQ135 gasSensor = MQ135(gaz);
  float air_quality = gasSensor.getPPM();
  Serial.print("Air Quality: ");  
  Serial.print(air_quality);
  char res[8];
  dtostrf(air_quality, 6, 2, res);
  client.publish(GAZ_CHANNEL, (char*)res);
  Serial.println("  PPM");   
}

void detect_temperature() {
  tempSensor.requestTemperatures();
  char res[8];
  dtostrf(tempSensor.getTempCByIndex(0), 6, 2, res);
  client.publish(TEMPERATURE_CHANNEL, (char*)res);
}
  


    
  
