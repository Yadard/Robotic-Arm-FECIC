#include "Bluetooth.h"
#include <Arduino.h>
#include <Servo.h>

BluetoothSerial bt;
Servo servos[4];

void setup() {
  bt.begin(9600);
  bt.setMessageStartChar('{');
  bt.setMessageEndChar('}');
  bt.setDelimiter("\n");

  for (size_t i = 0; i < 4; i++) {
    servos[i].attach(i + 2);
  }
}

void loop() {
  static uint32_t last_time = millis();
  static bool bt_master = false;
  static struct {
    uint8_t servo_index = 0;
    uint16_t last_servo_angle = 45;
    uint16_t servo_angle = 45;

  } bt_cmd[4];

  bt();
  if (bt.available()) {
    String msg = bt.readMessage();
    bt.sendMessage(msg.c_str());
    if (msg == "start") {
      bt_master = true;
    } else if (msg == "end") {
      bt_master = false;
    } else {
      size_t j = 0;
      for (int i = msg.indexOf(';'); i != -1; i = msg.indexOf(';')) {
        bt_cmd[j].servo_index = msg.substring(0, 1).toInt();
        bt_cmd[j++].servo_angle = msg.substring(2, i).toInt();
        msg = msg.substring(i + 1);
      }
    }
  }

  if (!bt_master) {
    for (size_t i = 0; i < 4; i++) {
      int val = 0;
      if (i == 1)
        val = map(analogRead(A0 + i), 1023, 0, 28, 90);
      else if (i == 2)
        val = map(analogRead(A0 + i), 1023, 0, 15, 90);
      else
        val = map(analogRead(A0 + i), 1023, 0, 0, 120);

      servos[i].write(val);
    }
  } else {
    uint32_t time = millis();
    if (time - last_time >= 100) {
      for (size_t i = 0; i < 4; i++) {
        servos[bt_cmd[i].servo_index].write(bt_cmd[i].servo_angle);
        if (bt_cmd[i].last_servo_angle != bt_cmd[i].servo_angle) {
          bt_cmd[i].last_servo_angle = bt_cmd[i].servo_angle;
        }
      }
      last_time = time;
    }
  }
}