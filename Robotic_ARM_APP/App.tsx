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
  Easing,
  Animated,
  Alert,
  Button,
} from 'react-native';

import SelectDropdown from 'react-native-select-dropdown'
import BluetoothSerial, { AndroidBluetoothDevice, iOSBluetoothDevice } from "react-native-bluetooth-serial-next";
import Slider from '@react-native-community/slider';

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
    console.log("delimiter");
    BluetoothSerial.addListener('read', ({ id, data }: { id: String, data: String }) => {
      if (connected && connected.device) {
        if (id === connected.device.id) {
          console.log("[RECEIVED]: \"", data.trimEnd(), "\"")
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
  const [update, set_update] = useState<boolean>(true);
  const animation_loading = useRef(new Animated.Value(0)).current;
  const dropdownRef = useRef<SelectDropdown>(null);
  const angles = [useState<number>(45), useState<number>(45), useState<number>(45), useState<number>(45)]
  let id = 0


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

  useEffect(() => {
    if (connected && connected.device) {
      if (update) {
        BluetoothSerial.write(`{0:${angles[0][0]};1:${angles[1][0]};2:${angles[2][0]};3:${angles[3][0]};}`)
        set_update(false)
        setTimeout(() => set_update(true), 100);
      }
    }
  }, [connected, update, angles[0][0], angles[1][0], angles[2][0], angles[3][0]])

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
                      BluetoothSerial.connect(selectedItem?.device.id).then(connect).catch((err) => { Alert.alert('Erro', err.message) })
                  }
                })
              }
              else {
                console.log("paired")
                BluetoothSerial.connect(selectedItem?.device.id).then(connect).catch((err) => { Alert.alert('Erro', err.message) })
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
            {angles.map(([angle, set_angle]) => {
              return (

                <View
                  key={id++}
                  style={{ maxHeight: 80, width: '100%', paddingTop: 30, flex: 1, alignItems: 'center' }}
                >
                  <Text>{angle}</Text>
                  <Slider
                    style={{ width: '70%', height: 25 }}
                    minimumValue={0}
                    maximumValue={120}
                    minimumTrackTintColor="#FFFFFF"
                    maximumTrackTintColor="#000000"
                    step={1}
                    onValueChange={(value) => {
                      console.log("value: ", value)
                      set_angle(value);
                    }}
                  />
                </View>
              )
            })}
            <View style={{ marginTop: 50 }}>
              <Button
                title={"Connect"}
                onPress={() => {
                  if (connected && connected.device)
                    BluetoothSerial.write("{start}", connected?.device.id);
                }}
              />
              <Button
                title={"Disconnect"}
                onPress={() => {
                  set_connected(undefined)
                  dropdownRef.current?.reset();
                  if (connected && connected.device) {
                    BluetoothSerial.write("{end}", connected?.device.id);
                    BluetoothSerial.disconnect(connected.device.id);
                  }

                }}
              />
            </View>
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

const radius = 100
const width = 10

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
    borderWidth: width,
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
