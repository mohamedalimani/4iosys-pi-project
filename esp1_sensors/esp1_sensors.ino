#include "DallasTemperature.h"
#include "OneWire.h"
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

const int PUBLISH_INTERVAL = 2000;

const char* ssid = "TT_4A58"; // Broker server Network
const char* password = "esprit2020";  // Network pwd
const char* mqttServer ="192.168.1.18";  // Broker ip (raspi) 
const int mqttPort = 1883;  // default MQTT port 
const char* mqttUser = "";  // no credentials for now
const char* mqttPassword = "";  // no cred for now
char res[8] ;
/// Channels 
const char* GAZ_CHANNEL = "123/gaz";  //"state/" + ID;
const char* FLAME_CHANNEL = "123/flame";  //"command/" + ID;
const char* LIGHT_CHANNEL = "123/light";
const char* TEMPERATURE_CHANNEL = "123/temp"; //->   temp²

WiFiClient espClient;
PubSubClient client(espClient);

int INH = 5 ;  // turn off to enable multiplexer from working 
int Z = A0 ; 
boolean sel_state[5][3] = {{LOW,LOW,LOW}, 
                          {HIGH,LOW,LOW},
                          {LOW,HIGH,LOW},
                          {HIGH,HIGH,LOW},
                          {LOW,LOW,HIGH}} ;

int sel[3] = {4,0,2} ;  //A : 4 B : 0 C : 2
String label[5] = {"flame :","gaz :","light exposure :","vibrations :","GPS :"} ;
int shift_delay = 500 ;
OneWire oneWire(13);
DallasTemperature tempSensor(&oneWire);

  void setup(){
  Serial.begin(9600) ;
  tempSensor.begin();
  for (int i = 0;i<3;i++){
    pinMode(sel[i],OUTPUT) ;
    }
  pinMode(INH,OUTPUT) ;
  pinMode(Z,INPUT) ;
  digitalWrite(INH,LOW) ; 

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
  
  }
  
  void loop(){  
    /*
     l : line c : column
     CBA = 000 => Z = first sensor (flame) 
     CBA = 001 => Z = 2nd sensor (GAZ)
     CBA = 010 => Z = 3rd sensor (VIBRATIONS) 
     CBA = 011 => Z = 4th sensor (GPS)
     */
    shift_sensors() ;
    }

  void alarm(){
    Serial.println("something is wrong inside the container") ;
  }

  void shift_sensors(){
       for (int l = 0; l<3;l++){
      Serial.println(label[l]) ;
      for (int c = 0; c<3;c++){
      digitalWrite(sel[c],sel_state[l][c]) ;
      }      
      float data = analogRead(Z) ; 
      switch(l){
        case 0 :
           res[8];
          dtostrf(data, 6, 2, res);
          client.publish(FLAME_CHANNEL, (char*)res);
        break ; 
        case 1 : 
          res[8];
          dtostrf(data, 6, 2, res);
          client.publish(GAZ_CHANNEL, (char*)res);
        break ;
        case 2 : 
          res[8];
          dtostrf(data, 6, 2, res);
          client.publish(LIGHT_CHANNEL, (char*)res);
        break ;
        case 3 : Serial.println("GPS data should be here") ;
        break ;
         case 4 : Serial.println("vibrations data should be here") ;
        break ;
        default:Serial.println("error !") ;
        break ;
    }

      Serial.println(data) ;
      check_data(l,data) ;
      delay(shift_delay) ;
      }
     detect_temperature() ;
    }

    void detect_temperature(){
     tempSensor.requestTemperatures();
     Serial.println("temperature :") ;
    Serial.println(tempSensor.getTempCByIndex(0));
    /**
    res[8];
    dtostrf(tempSensor.getTempCByIndex(0), 6, 2, res);
    client.publish(TEMPERATURE_CHANNEL, (char*)res);
    **/
          
     if (tempSensor.getTempCByIndex(0) > 40){
      Serial.println("temperature is over 40C") ;
      }
      }

   void check_data(int li, float d){
      if (li == 0 && d < 120){   // check flame 
        alarm() ;
        }
      if (li == 1 && d > 340){   // check gaz
        alarm() ;
        }
        if (li == 2 && d > 550){   // check light exposure
          Serial.print("high light exposure, looks like your") ;
          Serial.println(" container is open") ;
          }
    }
