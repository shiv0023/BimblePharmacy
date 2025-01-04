import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, StatusBar, Platform, Alert,Modal } from 'react-native';
import { AppointmentStatus, AppointmentStatus2, AppointmentUserIcon, MenuIcon, PatientFemaleImg, PatientImage, UserIcon } from './svgComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import { ScaledSheet, moderateScale, verticalScale, scale } from 'react-native-size-matters';
import SidebarMenu from '../Navigation/SideBar';
const appointments = [
  {
    id: '1',
    name: 'Sophia Christopher',
    gender: 'F',
    age: 30,
    phone: '5436789567',
    status: 'N',
    description: 'Experience Fatigue due to lack of sleep. There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.',
    avatar: <PatientFemaleImg/>,
    genderIcon: 'https://example.com/icons/female.png',
  },
  {
    id: '2',
    name: 'Aiden Sheppard',
    gender: 'M',
    age: 25,
    phone: '6345789567',
    status: 'F',
    description: 'Experience Fatigue due to lack of sleep.',
    avatar: <PatientImage/>,
    genderIcon: 'https://example.com/icons/male.png',
  },
  {
    id: '3',
    name: 'Aiden Sheppard',
    gender: 'M',
    age: 25,
    phone: '6345789567',
    status: 'F',
    description: 'Experience Fatigue due to lack of sleep.',
    avatar: <PatientImage/>,
    genderIcon: 'https://example.com/icons/male.png',
  },
];

export default function Appointment({ navigation }) {
  const [currentDate, setCurrentDate] = useState('');
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };
  const Navigation = useNavigation()
  useEffect(() => {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    setCurrentDate(formattedDate);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigation.replace('Login');
      }
    };
    
    checkAuth();
  }, [navigation]);

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.card,
        { borderColor: item.status === 'N' ? '#0049F8' : 'grey' },
      ]}
    >
      <View style={{ padding: moderateScale(15) }}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>{item.avatar}</View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>
              {item.status === 'N' ? <AppointmentStatus /> : <AppointmentStatus2 />}
            </View>
            <View style={styles.row}>
              <View style={styles.infoText}>
                <Text >
                  <Text style={{fontFamily:'SFPRODISPLAYLIGHTITALIC',fontWeight:700,color:'#191919'}}>PHN:</Text> {item.phone}</Text>
              </View>
              <View style={styles.infoText}>
                <Text style={{fontFamily:'SFPRODISPLAYLIGHTITALIC',fontWeight:400,}}>{item.gender}</Text>
              </View>
              <View style={styles.infoText}>
                <Text>{item.age} Years</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      <View style={styles.statusBadgeWrapper}>
        <LinearGradient
          colors={
            item.status === 'N'
              ? ['#2968FF', '#0049F8']
              : ['#06D001', '#008D00']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusBadge}
        >
          <Text style={styles.statusBadgeText}>
            {item.status === 'N' ? 'N' : 'F'}
          </Text>
        </LinearGradient>
      </View>
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: item.status === 'N' ? '#0049F8' : '#D0D8E7',
          },
        ]}
        onPress={() =>
          navigation.navigate(
            item.status === 'N' ? 'Chat' : 'followupchat'
          )
        }
      >
        <Text
          style={[
            styles.actionButtonText,
            {
              color: item.status === 'N' ? '#fff' : '#666',
            },
          ]}
        >
          {item.status === 'N' ? 'Continue' : 'Waiting'}
        </Text>
      </TouchableOpacity>
    </View>
  );


  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const token = await AsyncStorage.getItem('auth_token');
  //     console.log('Auth Token:', token); // Debug token retrieval
  //     if (token) {
  //       navigation.navigate('Appointment');
  //     } else {
  //       navigation.navigate('Login');
  //     }
  //   };
  
  //   checkAuth();
  // }, []);
  
  const handleLogout = async () => {
    try {

      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('remember_me');



      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Successfully logged out!',
        text2: 'See you again!',
        visibilityTime: 6000,
        autoHide: true,
      });
      Navigation.navigate('Login');

    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'An error occurred while logging out.');
    }
  };


  return (

    <View style={styles.container}>
      <StatusBar backgroundColor="#0049F8" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuIconWrapper}>
            <View>
            <MenuIcon onPress={() => setSidebarVisible(true)}/>
            {isSidebarVisible && <SidebarMenu onClose={() => setSidebarVisible(false)} />}

            </View>
          </TouchableOpacity>
          <Text style={styles.headerText}>Appointments</Text>
        </View>

        <TouchableOpacity onPress={handleLogout}>
          <AppointmentUserIcon style={styles.headerAvatar} />

        </TouchableOpacity>

      </View>
      <Modal
        visible={isSidebarVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleSidebar}
      >
        <SidebarMenu onClose={toggleSidebar} />
      </Modal>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Text style={[styles.tabText, styles.activeTab]}>Today</Text>
        <Text onPress={()=>navigation.navigate('followupchat')} style={styles.tabText1}>Upcoming</Text>
      </View>
      <View style={styles.tabSeparator} />

      {/* Current Date */}
      <View style={styles.dateWrapper}>
        <View style={styles.line} />
        <Text style={styles.dateText}>{currentDate}</Text>
        <View style={styles.line} />
      </View>


      {/* Appointment List */}
      <FlatList
        data={appointments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>

  );
}

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', },
  header: {
    backgroundColor: '#0049F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(15),
    paddingTop: Platform.OS === 'ios' ? moderateScale(45) : moderateScale(10),
    paddingBottom: moderateScale(10),
    height: Platform.OS === 'ios' ? verticalScale(90) : verticalScale(65),
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  menuIconWrapper: { 
    padding: moderateScale(5),
  },
  headerText: { 
    color: '#fff', 
    fontSize: moderateScale(20), 
    fontWeight: '700', 
    marginLeft: moderateScale(10), 
    fontFamily: 'Product Sans Bold Italic'
  },
  headerAvatar: { 
    alignItems: 'center',
    padding: moderateScale(5),
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0049F8',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
   

  },
  tabText: { fontSize: 18, fontWeight: '400', paddingVertical: 10, color: '#fff', fontFamily: 'Product Sans Bold Italic' },
  tabText1: { fontSize: 16, paddingVertical: 10, color: 'rgba(241,243,247,0.45)' ,fontFamily: 'Product Sans Bold Italic'},
  activeTab: { fontWeight: 'bold', borderBottomWidth: 5, borderBottomColor: '#fff', padding: 70,borderRadius:4},
  tabSeparator: { height: 2, backgroundColor: '#ddd' },

  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 15
  },
  dateText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
    paddingHorizontal: 10,

  },
  line: {
    height: 1,
    backgroundColor: '#ddd',
    flex: 1,
    margin: 10  
  },
 
  card: {
    backgroundColor: '#FFF',
    margin: 10,
    borderRadius: 8,
    borderColor: '#0049F8',
    borderWidth: 1,
    position: 'relative',

  },
  cardHeader: { flexDirection: 'row', marginBottom: 15,margin:10 },
  avatar: {  borderRadius: 25, marginRight: 10,marginBottom:20 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '700', marginRight: 5,fontFamily: 'Product Sans Bold Italic' },
  genderIcon: { width: 14, height: 14 },

  row: {
    flexDirection: 'row',
    marginTop: verticalScale(5),
    flexWrap: 'wrap',
    marginBottom: verticalScale(5),
  },
  infoText: {
    color: 'rgba(25,25,25,1)',
    fontSize: moderateScale(14),
    padding: moderateScale(4),
    backgroundColor: 'rgba(241,243,247,1)',
    marginRight: scale(10),
    marginBottom: verticalScale(5),
    borderRadius: moderateScale(4),
  },

  statusBadgeWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  statusBadge: {
    width: moderateScale(36),
    height: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 7,
  },
  statusBadgeText: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    color: '#fff',
    textAlign: 'center',
    fontFamily:'SFPRODISPLAYLIGHTITALIC',
    
  },

  description: { color: '#191919', fontSize: 14, marginBottom: 10 ,fontWeight:400,fontFamily:'SFPRODISPLAYLIGHTITALIC'},
  actionButton: { padding: 16, borderRadius: 5, },
  actionButtonText: { fontWeight: '400', textAlign: 'center',fontFamily:'Product Sans Italic',fontSize:18 },
  genderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  genderIcon: {
    width: 14,
    height: 14,
    marginRight: 3,
  },
  genderText: {
    fontSize: 14,
    color: 'rgba(25,25,25,1)',
    padding: 4

  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 15,
  },
  

});

