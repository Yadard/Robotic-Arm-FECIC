#include "Bluetooth.h"

BluetoothSerial::BluetoothSerial() {}
void BluetoothSerial::begin(long speed) { Serial.begin(speed); }

bool BluetoothSerial::available() { return _arrived_message; }

void BluetoothSerial::operator()() {
  if (Serial.available()) {
    const char ch = Serial.read();
    if (ch == _start_message_char && !_arrived_message) {
      _message = "";
      _started_message = true;
    } else if (ch == _end_message_char) {
      _arrived_message = true;
      _started_message = false;
    } else if (isPrintable(ch) && _started_message) {
      _message.concat(ch);
    }
  }
}

void BluetoothSerial::setDelimiter(const char *delimiter) {
  _delimiter = delimiter;
}

void BluetoothSerial::setMessageStartChar(const char ch) {
  _start_message_char = ch;
}

void BluetoothSerial::setMessageEndChar(const char ch) {
  _end_message_char = ch;
}

String BluetoothSerial::readMessage() {
  _arrived_message = false;
  return _message;
}
void BluetoothSerial::sendMessage(const char *message) {
  Serial.print(message);
  Serial.print(_delimiter);
}
