import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  Alert,
} from 'react-native';
import { HomeIcon, LogoutIcon, ProfileIcon, SettingIcon } from '../component/svgComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const SidebarMenu = ({ onClose }) => {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.60)).current; // Start off-screen
  const fadeAnim = useRef(new Animated.Value(0)).current; // Opacity for the overlay

  useEffect(() => {
    // Slide in animation with overlay fade-in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0, // Slide to fully visible
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, // Fade overlay to visible
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);


 
  const handleLogout = async () => {
    try {
      // First, animate the sidebar closing
      await Promise.all([
        new Promise((resolve) => {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: -Dimensions.get('window').width * 0.60,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(resolve);
        }),
      ]);

      // Then clear the storage and navigate
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('remember_me');
      onClose(); // Close the sidebar
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'An error occurred while logging out.');
    }
  };

  const handleClose = () => {
    // Slide out animation with overlay fade-out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -Dimensions.get('window').width * 0.60, // Slide back off-screen
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0, // Fade overlay to invisible
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onClose()); // Call onClose after animation
  };

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: fadeAnim }]}
      >
        <Pressable style={styles.overlayTouchable} onPress={handleClose} />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          {/* <Text style={styles.closeText}>✕</Text> */}
        </TouchableOpacity>

        {/* Menu Items - removed menuTitle and adjusted spacing */}
        <View style={styles.menuItemsContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.icon}>
              <HomeIcon color="white" />
            </View>
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.icon}>
              <ProfileIcon color="white" />
            </View>
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.icon}>
              <SettingIcon color="white" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.icon}>
              <LogoutIcon color="white" />
            </View>
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    width: Dimensions.get('window').width * 0.60,
    height: '100%',
    backgroundColor: '#2968FF',
    paddingLeft: 20,
    position: 'absolute',
    left: 0,
    top: 0,
    paddingTop: 50, // Add top padding to adjust spacing
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  closeText: {
    fontSize: 18,
    color: '#fff',
  },
  menuItemsContainer: {
    marginTop: 20, // Add space at the top of the menu items
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25, // Increased spacing between items
  },
  icon: {
    marginRight: 10, // Add margin to create space between icon and text
  },
  menuText: {
    fontSize: 22,
    color: '#fff',
  },
});

export default SidebarMenu;
