#include "MQ135.h"

const int flameSensor = A0 ; 
const int buzzer = 5 ;
const int temp = 4 ;
const int gaz = 0 ;
float fs ;
float t  ; 

void setup(){
 // pinMode(flameSensor,OUTPUT) ;
 // pinMode(temp,OUTPUT) ;
  Serial.begin(9600) ;
  }
  
  void loop(){
    detect_flame() ;
    delay(500);
    detect_gaz() ;
    delay(500);
    }

  void detect_flame(){
    fs = analogRead(flameSensor) ;
    Serial.print("Flame: ");
    Serial.println(fs);
    if (fs == 0){
        alarm() ;
      }
    }
   
  void alarm(){
    tone(buzzer,2000) ;
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
    MQ135 gasSensor = MQ135(A0);
    float air_quality = gasSensor.getPPM();
    Serial.print("Air Quality: ");  
    Serial.print(air_quality);
    Serial.println("  PPM");   
    Serial.println();
    }

  
  


    
  
