import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MenuIcon } from './svgComponent';

const { width, height } = Dimensions.get('window');

const CustomHeader = ({ title, IconComponent, phoneNumber, chatType, onCall }) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView >
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.openDrawer()} 
        style={styles.menuIconWrapper}
      >
        <MenuIcon />
      </TouchableOpacity>
      <Text variant="heading" style={styles.headerTitle}>{title}</Text>
      {IconComponent && (
        <TouchableOpacity 
          onPress={onCall}
          style={styles.callButton}
        >
          <IconComponent style={styles.icon} />
        </TouchableOpacity>
      )}
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // backgroundColor: '#0049F8',

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0049F8',
    paddingVertical: height * 0.01, // Responsive vertical padding
    paddingHorizontal: width * 0.04, // Responsive horizontal padding
    width: '100%',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: width * 0.05, // Responsive font size
    color: '#fff',
    
  },
  menuIconWrapper: {
    padding: width * 0.02, // Responsive padding
  },
  menuIcon: {
    fontSize: width * 0.06, // Responsive icon size
    color: '#fff',
  },
  icon: {
    width: width * 0.06, // Responsive icon size
    height: width * 0.06, // Responsive icon size
  },
  callButton: {
    padding: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomHeader;