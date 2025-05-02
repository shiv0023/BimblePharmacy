import React from 'react';
import { StyleSheet, View } from 'react-native';
import DrawerNavigator from './src/Navigation/DrawerNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';

const App = () => {
  return (
    <SafeAreaView 
      style={styles.safeArea} 
      edges={[ 'bottom', 'left', 'right']} 
    >
      <DrawerNavigator />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default App;
