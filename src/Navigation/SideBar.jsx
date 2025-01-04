import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { HomeIcon, LogoutIcon, ProfileIcon, SettingIcon } from '../component/svgComponent';

const SidebarMenu = ({ onClose }) => {
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
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.menuTitle}>Menu</Text>

        {/* Menu Items */}
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
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.icon}>
            <LogoutIcon color="white" />
          </View>
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
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
    padding: 20,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  closeText: {
    fontSize: 18,
    color: '#fff',
  },
  menuTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
