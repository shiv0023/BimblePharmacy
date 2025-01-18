import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import Appointment from '../component/Appointment';
import Chat from '../component/Chat';
import MyStack from './StackNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeIcon, LogoutIcon, ProfileIcon, SettingIcon } from '../component/svgComponent';

const Drawer = createDrawerNavigator();

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

const CustomDrawerContent = (props) => {
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('auth_token');
              await AsyncStorage.removeItem('remember_me');
              props.navigation.reset({
                index: 0,
                routes: [{ name: 'stack', params: { screen: 'Login' } }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.drawerContainer}>
      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => props.navigation.navigate('stack', { screen: 'Appointment' })}
      >
        <View style={styles.iconTextWrapper}>
          <HomeIcon color="#fff" />
          <Text variant='accent' style={styles.drawerItemText}>Home</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => props.navigation.navigate('stack', { screen: 'Chat' })}
      >
        <View style={styles.iconTextWrapper}>
          <ProfileIcon color="#fff" />
          <Text variant='accent' style={styles.drawerItemText}>Profile</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => props.navigation.navigate('stack', { screen: 'Chat' })}
      >
        <View style={styles.iconTextWrapper}>
          <SettingIcon color="#fff" />
          <Text variant='accent' style={styles.drawerItemText}>Setting</Text>
        </View>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={[styles.drawerItem, styles.logoutItem]} onPress={handleLogout}>
        <View style={styles.iconTextWrapper}>
          <LogoutIcon color="#fff" />
          <Text variant='accent' style={styles.drawerItemText}>Logout</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#004aad',
          width: width * 0.75,
          maxWidth: 350,
        },
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#ccc',
        headerShown: false,
      }}
    >
      <Drawer.Screen 
        name="stack" 
        component={MyStack}
        options={{
          swipeEnabled: false,
          gestureEnabled: false
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#2968FF',
    padding: width * 0.04,
    paddingTop: isIOS ? 50 : 30,
  },
  iconTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerItem: {
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.03,
    borderRadius: 8,
    marginBottom: height * 0.01,
  },
  drawerItemText: {
    color: '#fff',
    fontSize: width * 0.04,
    marginLeft: width * 0.03,
   
  },
  logoutItem: {
    marginTop: 'auto',
    backgroundColor: '#003080',
    marginBottom: isIOS ? 34 : 24,
  },
});
