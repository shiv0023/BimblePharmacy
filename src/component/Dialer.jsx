import React from 'react';
import { Button, Linking, Alert, View, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const Call = () => {
  const makeDirectCall = async (phoneNumber) => {
    const phoneURL = `tel:${phoneNumber}`;

    if (Platform.OS === 'android') {
      try {
        const permission = await check(PERMISSIONS.ANDROID.CALL_PHONE);

        if (permission === RESULTS.GRANTED) {
          Linking.openURL(phoneURL).catch((err) =>
            Alert.alert('Error', 'Unable to make the call.')
          );
        } else {
          const requestPermission = await request(PERMISSIONS.ANDROID.CALL_PHONE);
          if (requestPermission === RESULTS.GRANTED) {
            Linking.openURL(phoneURL).catch((err) =>
              Alert.alert('Error', 'Unable to make the call.')
            );
          } else {
            Alert.alert('Permission Denied', 'Cannot make the call.');
          }
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred while requesting permissions.');
      }
    } else {
      // iOS only opens the dialer
      Linking.openURL(phoneURL).catch((err) =>
        Alert.alert('Error', 'Unable to make the call.')
      );
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Call 1234567890"
        onPress={() => makeDirectCall('1234567890')}
      />
    </View>
  );
};

export default Call;
