import React from 'react';
import { StyleSheet, View } from 'react-native';
import DrawerNavigator from './src/Navigation/DrawerNavigation';
import TabViewExample from './src/Navigation/TabView';

const App = () => {
  return (
    <View style={{ flex: 1 }}>
      <DrawerNavigator>
        <TabViewExample />
      </DrawerNavigator>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({});
