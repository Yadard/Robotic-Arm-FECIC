/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Easing,
  Animated,
  TextInput,
  Alert,
  Button,
} from 'react-native';

import SelectDropdown from 'react-native-select-dropdown'
import BluetoothSerial, { AndroidBluetoothDevice, CommonDevice, connect, iOSBluetoothDevice } from "react-native-bluetooth-serial-next";

interface BluetoothDevice {
  device?: BluetoothSerial.AndroidBluetoothDevice | BluetoothSerial.iOSBluetoothDevice
  paired: boolean
};

async function start(connected: BluetoothDevice | undefined, set_devices: React.Dispatch<React.SetStateAction<BluetoothDevice[]>>) {
  const bt_enable = await BluetoothSerial.isEnabled();
  if (!bt_enable)
    await BluetoothSerial.enable();
  await BluetoothSerial.list().then((paireds) => {
    console.log("[", new Date(), "]: paired");
    const arr = [...paireds]
    const ids = paireds.map(o => o.id)
    const filtered = arr.filter(({ id }, index) => !ids.includes(id, index + 1))
    set_devices(filtered.map((device) => { return { device, paired: true } }))
  }).catch(err => console.error(err))
  BluetoothSerial.listUnpaired().then((unpaireds) => {
    console.log("[", new Date(), "]: unpaired");
    const arr = [...unpaireds]
    const ids = unpaireds.map(o => o.id)
    const filtered = arr.filter(({ id }, index) => !ids.includes(id, index + 1))
    set_devices(filtered.map((device) => { return { device, paired: false } }))
  }).catch(err => console.error(err))

  BluetoothSerial.withDelimiter('\n').then((_) => {
    BluetoothSerial.addListener('read', ({ id, data }) => {
      if (connected && connected.device) {
        if (id === connected.device.id) {
          console.log("[RECEIVED]: \"", data, "\"")
        }
      }
    })
  }).catch(err => console.error(err))
}

const App = () => {
  const [devices, set_devices] = useState<BluetoothDevice[]>([]);
  const [connected, set_connected] = useState<BluetoothDevice | undefined>(undefined);
  const [loading, set_loading] = useState<boolean>(true);
  const [connecting, set_connecting] = useState<boolean>(false);
  const animation_loading = useRef(new Animated.Value(0)).current;
  const dropdownRef = useRef<SelectDropdown>(null);


  useEffect(() => {
    start(connected, set_devices).then(() => {
      console.log("[", new Date(), "]: loading");
      set_loading(false)
    })
  }, []);

  useEffect(() => {
    if (loading || !connected) {
      Animated.loop(Animated.timing(
        animation_loading,
        {
          toValue: 360,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false
        }
      ), { iterations: -1 }).start()
    } else {
      Animated.loop(Animated.timing(
        animation_loading,
        {
          toValue: 360,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false
        }
      ), { iterations: -1 }).stop()
    }
  }, [loading, connected])

  if (loading)
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.progress, {
          // Transforms 0 -> 360 to '0deg' -> '360deg'
          transform: [{
            rotateZ: animation_loading.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg']
            })
          }]
        }]} />
      </SafeAreaView>
    );
  else
    return (
      <SafeAreaView style={{ flex: 1, width: '100%', height: '100%', alignContent: 'center', alignItems: 'center' }}>
        <SelectDropdown
          data={devices}
          ref={dropdownRef}
          defaultButtonText={"Select the Robotic ARM"}
          onSelect={(selectedItem: BluetoothDevice, _) => {
            if (selectedItem && selectedItem.device) {
              set_connecting(true);
              const connect = (_: AndroidBluetoothDevice | iOSBluetoothDevice) => {
                set_connecting(false);
                console.log("connected", selectedItem)
                set_connected(selectedItem)
                if (selectedItem && selectedItem.device)
                  BluetoothSerial.write("{start}", selectedItem?.device.id)
              };
              if (!selectedItem.paired) {
                console.log("unpaired")
                BluetoothSerial.pairDevice(selectedItem?.device.id).then((id) => {
                  if (id) {
                    if (selectedItem && selectedItem.device)
                      BluetoothSerial.connect(selectedItem?.device.id).then(connect).catch((err) => { Alert.alert(err) })
                  }
                })
              }
              else {
                console.log("paired")
                BluetoothSerial.connect(selectedItem?.device.id).then(connect).catch((err) => { Alert.alert(err) })
              }
            }
          }}

          buttonTextAfterSelection={(selectedItem: BluetoothDevice, _) => {
            // text represented after item is selected
            // if data array is an array of objects then return selectedItem.property to render after item is selected
            if (selectedItem.device)
              return selectedItem?.device.name
            else
              return ""
          }}

          rowTextForSelection={(selectedItem, _) => {
            return selectedItem.device.name
          }}

          buttonStyle={styles.dropdown3BtnStyle}

          renderCustomizedRowChild={(item, _) => {
            return (
              <View style={styles.dropdown3RowChildStyle}>
                <Text style={styles.dropdown3RowName}>{item.device.name}</Text>
                <Text style={styles.dropdown3RowAddress}>{item.device.id}</Text>
              </View>
            );
          }}
        />
        {connected !== undefined ?
          <>
            {/* <TextInput
              style={{ backgroundColor: 'white', width: '75%', maxHeight: '80%', color: 'black' }}
              placeholder="message"
              onEndEditing={(ev) => {
                if (connected && connected.device)
                  BluetoothSerial.write(`{${ev.nativeEvent.text}}`, connected?.device.id);
              }}
            /> */}
            <Button
              title={"Disconnect"}
              onPress={() => {
                set_connected(undefined)
                dropdownRef.current?.reset();
                if (connected && connected.device)
                  BluetoothSerial.write("{end}", connected?.device.id);
              }}
            />
          </>
          :
          connecting ?
            < SafeAreaView style={styles.container}>
              <Animated.View style={[styles.progress, {
                // Transforms 0 -> 360 to '0deg' -> '360deg'
                transform: [{
                  rotateZ: animation_loading.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }]} />
            </SafeAreaView>
            :
            <></>
        }
      </SafeAreaView >
    );
};

const radius = 50

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: radius,
    height: radius,
    justifyContent: 'center',
    alignItems: 'center'
  },
  progress: {
    width: radius,
    height: radius,
    borderRadius: radius / 2,
    borderWidth: 8,
    borderColor: 'grey',
    borderTopColor: 'white',
    position: "absolute",
    opacity: 1
  },
  dropdown3BtnStyle: {
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '80%'
  },
  dropdown3RowChildStyle: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },

  dropdown3RowName: {
    color: 'black',
    fontSize: 18
  },

  dropdown3RowAddress: {
    color: 'grey',
    fontSize: 10
  },

  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
