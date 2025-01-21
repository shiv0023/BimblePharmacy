import React from 'react';
import { StyleSheet, View } from 'react-native';
import DrawerNavigator from './src/Navigation/DrawerNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';


const App = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['bottom']}>
      <DrawerNavigator>
    
      </DrawerNavigator>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({});
