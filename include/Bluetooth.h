#ifndef BLUETOOTH_H
#define BLUETOOTH_H

#include <Arduino.h>
#include <SoftwareSerial.h>

class BluetoothSerial {
public:
  BluetoothSerial();

  void begin(long speed);
  bool available();
  String readMessage();
  void sendMessage(const char *message);
  void operator()();

  void setDelimiter(const char *delimiter);
  void setMessageStartChar(const char ch);
  void setMessageEndChar(const char ch);

private:
  String _message;
  String _delimiter;

  bool _arrived_message = false;
  bool _started_message = false;
  char _start_message_char = '\0', _end_message_char = '\0';
};

#endif
