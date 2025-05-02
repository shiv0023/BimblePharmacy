import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MenuIcon } from './svgComponent';

const { width, height } = Dimensions.get('window');

// Define the header background color as a constant
const HEADER_BACKGROUND_COLOR = '#0049F8';

const CustomHeader = ({ title, IconComponent, phoneNumber, chatType, onCall }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar 
        backgroundColor={HEADER_BACKGROUND_COLOR}
        barStyle="light-content"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.openDrawer()} 
          style={styles.menuIconWrapper}
        >
          <MenuIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        {IconComponent && (
          <TouchableOpacity 
            onPress={onCall}
            style={styles.callButton}
          >
            <IconComponent style={styles.icon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: HEADER_BACKGROUND_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HEADER_BACKGROUND_COLOR,
    paddingVertical: 15,
    paddingHorizontal: width * 0.04,
    width: '100%',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    
  },
  menuIconWrapper: {
    padding: width * 0.02,
  },
  menuIcon: {
    fontSize: width * 0.06,
    color: '#fff',
  },
  icon: {
    width: width * 0.06,
    height: width * 0.06,
  },
  callButton: {
    padding: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const headerBackgroundColor = HEADER_BACKGROUND_COLOR;
export default CustomHeader;