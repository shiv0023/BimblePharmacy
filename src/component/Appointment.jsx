import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,

  SafeAreaView,
  Dimensions,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  AppointmentStatus,
  AppointmentStatus2,
  AppointmentUserIcon,

  PatientFemaleImg,
  PatientImage,
  UserIcon,
} from './svgComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LinearGradient from 'react-native-linear-gradient';
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
  scale,
} from 'react-native-size-matters';
import { PanGestureHandler } from 'react-native-gesture-handler';
import CustomHeader from './CustomHeader';
import { SafeAreaView as SafeAreaViewSafeAreaContext } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAppointments, setSelectedAppointmentAndFetchDetails } from '../Redux/Slices/AppointmentSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


// const appointments = [
//   {
//     id: '1',
//     name: 'Sophia Christopher',
//     gender: 'F',
//     age: 30,
//     phone: '5436789567',
//     status: 'N',
//     description:
//       'Experience Fatigue due to lack of sleep. There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.',
//     avatar: <PatientFemaleImg />,
//     genderIcon: 'https://example.com/icons/female.png',
//   },
//   {
//     id: '2',
//     name: 'Aiden Sheppard',
//     gender: 'M',
//     age: 25,
//     phone: '6345789567',
//     status: 'F',
//     description: 'Experience Fatigue due to lack of sleep.',
//     avatar: <PatientImage />,
//     genderIcon: 'https://example.com/icons/male.png',
//   },
//   {
//     id: '3',
//     name: 'Aiden Sheppard',
//     gender: 'M',
//     age: 25,
//     phone: '6345789567',
//     status: 'F',
//     description: 'Experience Fatigue due to lack of sleep.',
//     avatar: <PatientImage />,
//     genderIcon: 'https://example.com/icons/male.png',
//   },
// ];

// Get window dimensions
const { width, height } = Dimensions.get('window');

function formatPatientName(name) {
  // Remove spaces after commas and convert to uppercase
  return name.replace(/, /g, ',').toUpperCase();
}

export default function Appointment({navigation}) {
  const [currentDate, setCurrentDate] = useState('');
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const dispatch = useDispatch();
  const userData = useSelector((state) => state?.auth?.Appointment?.data || []);




  const tabs = ['Today', 'Upcoming'];

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
    const fetchAppointmentsData = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); 
        
       
        
        dispatch(fetchAppointments({ 
          startDate, 
          endDate: endDate.toISOString().split('T')[0],
          token 
        }));
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointmentsData();
  }, [dispatch]);

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

  const handleSwipe = (event) => {
    const { translationX } = event.nativeEvent;
    if (translationX > 50) {
      setCurrentTabIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    } else if (translationX < -50) {
      setCurrentTabIndex((prevIndex) => Math.min(prevIndex + 1, tabs.length - 1));
    }
  };

  const formatAppointmentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getStatusColors = (status) => {
    switch (status) {
      case 'Cancelled':
        return ['#FF4949', '#FF0000'];
      case 'To Do':
        return ['#2968FF', '#0049F8'];
      default:
        return ['#06D001', '#008D00'];
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Cancelled':
        return 'C';
      case 'To Do':
        return 'N';
      default:
        return 'F';
    }
  };

  const handleAppointmentPress = (appointment) => {
    console.log(appointment.deliveryMethod, 'appointment.deliveryMethod')
    dispatch(setSelectedAppointmentAndFetchDetails(appointment));
    
    navigation.navigate("Chat", {
      from: appointment.status === 'N' ? 'NEW' : 'FOLLOWUP',
      demographicNo: appointment.demographicNo,
      status: appointment.status,
      appointmentNo: appointment.appointmentNo,
      deliveryMethod: appointment.deliveryMethod
    });
  };

  const renderItem = ({item}) => {
    const isToday = item.appointmentDate === getCurrentDate();
    const isNew = item.status === 'N';

    return (
      <View
        style={[
          styles.card,
          {
            borderColor: isNew ? '#0049F8' : '#bfc9c2',
          },
        ]}>
      

        <View>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              {/* <PatientImage /> */}
            </View>
            <View style={{flex: 1}}>
              <View style={styles.nameRowWrap}>
                <Text variant="subheading"
                  style={styles.patientName}
                  numberOfLines={2}
                
                >
                  {formatPatientName(item.patientName)}
                  <Text style={styles.slashText}> / </Text>
                  <Text style={styles.genderBadgeText}>F</Text>
                  <Text style={styles.slashText}> / </Text>
                  <Text style={styles.ageText}>32 years</Text>
                </Text>
              </View>
              <View style={styles.row}>
                <View>
                  <Text>
                    <Text style={styles.phnLabel}>PHN: </Text>
                    <Text variant="subheading" style={styles.phnValue}>{item.clinicContact}</Text>
                  </Text>
                </View>
                <View style={styles.timeInfoBox}>
                  <Text style={styles.appointmentTime}>
                    {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',  paddingBottom: 2, paddingTop: 2 }}>
            <Text style={styles.reasonText}>
              Reason: {item.reason} {item.reasonDesc}
            </Text>
            <View style={styles.IconContainer}>
            <TouchableOpacity onPress={() => handleAppointmentPress(item)}>
              <Icon style={{justifyContent:'center',paddingTop:5}} name="arrow-top-right" size={28} color="#0049F8" />
            </TouchableOpacity>
            </View>
       
          </View>
          
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusBadgeWrapper}>
            <LinearGradient
              colors={isNew ? ['#2968FF', '#0049F8'] : ['#06D001', '#008D00']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {isNew ? 'N' : 'F'}
              </Text>
            </LinearGradient>
          </View>
          
         
            {/* <View style={[
              styles.eligibilityBadge,
              { backgroundColor: item.eligibility === "YES" ? '#E3F2FD' : '#FFEBEE' }
            ]}>
              <Text style={[
                styles.eligibilityText,
                { color: item.eligibility === "YES" ? '#0049F8' : '#D32F2F' }
              ]}>
                {item.eligibility === "YES" ? "Eligible" : "Not Eligible"}
              </Text>
            </View> */}
       
        </View>

        {/* <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isNew ? '#0049F8' : '#D0D8E7',
            },
          ]}
          onPress={() => handleAppointmentPress(item)}>
          <Text style={[styles.actionButtonText, {
            color: isNew ? '#fff' : '#666',
          }]}>
            {isNew ? 'Continue' : 'Waiting'}
          </Text>
        </TouchableOpacity> */}
      </View>
    );
  };
  return (
    <PanGestureHandler onGestureEvent={handleSwipe}>
      <SafeAreaViewSafeAreaContext style={styles.safeArea}>
        <StatusBar backgroundColor={Platform.OS === 'ios' ? 'red' : '#0049F8'} barStyle="light-content" />
        <CustomHeader title="Appointments" IconComponent={AppointmentUserIcon} />
        {/* Appointment List */}
        <View style={styles.content}>
          {/* Tabs */}
          <View style={styles.tabs}>
            {tabs.map((tab, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setCurrentTabIndex(index)} 
                style={styles.tabWrapper}
              >
                <Text style={styles.tabText}>{tab}</Text>
                {currentTabIndex === index && <View style={styles.activeTab}></View>}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tabSeparator} />

          {/* Current Date */}
          <View style={styles.dateWrapper}>
            <View style={styles.line} />
            <Text variant="accent" style={styles.dateText}>{currentDate}</Text>
            <View style={styles.line} />
          </View>

          {userData.length > 0 ? (
            <FlatList
              data={userData.filter(item => {
                const today = getCurrentDate();
                const itemDate = item.appointmentDate;
                
                // Skip cancelled appointments
                if (item.status === 'Cancelled') {
                  return false;
                }
                
                if (currentTabIndex === 0) {
                  // Today's appointments
                  return itemDate === today;
                } else {
                  // Upcoming appointments
                  return itemDate > today;
                }
              }).sort((a, b) => {
                // Sort by date first
                const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
                if (dateCompare !== 0) return dateCompare;
                // Then by time
                return a.startTime.localeCompare(b.startTime);
              })}
              renderItem={renderItem}
              keyExtractor={item => item.appointmentNo.toString()}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No appointments available for {currentTabIndex === 0 ? 'today' : 'upcoming days'}
                </Text>
              }
            />
          ) : (
            <Text style={styles.emptyText}>No appointments available</Text>
          )}
        </View>
      </SafeAreaViewSafeAreaContext>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  footer: {
    backgroundColor: 'white',
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: {
      height: 0,
      width: 0
    }
  },
  safeArea: {flex: 1, backgroundColor: '#0049F8'},
  content: {flex: 1, backgroundColor: '#f8f9fa',    paddingBottom: verticalScale(20),},
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0049F8',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    
  },
  tabText: {
    fontSize: 18,
    position:'relative',
    // fontWeight: '400',
   padding:10,
    paddingHorizontal:70,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontFamily: 'Product Sans Regular',
    paddingTop:0,
  },
  
  tabText1: {
    fontSize: 16,
    paddingVertical: 10,
    color: 'rgba(241,243,247,0.45)',
    fontFamily: 'Product Sans Regular',
    paddingTop:0,
    
  },
  activeTab: {
    position:'absolute',
    bottom:0,
    left:0,
    width:"100%",
    backgroundColor:'#FFFFFF',
    borderTopRightRadius:5,
    borderTopLeftRadius:5,
    height:4,
    marginLeft:10,

    
  },
  tabSeparator: {height: 2, backgroundColor: '#ddd'},

  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 15,
  },
  dateText: {
    paddingHorizontal: 10,
    lineHeight:18.2
    
  },
  // line: {
  //   height: 1,
  //   backgroundColor: '#ddd',
  //   flex: 1,
  //   margin: 10,ZRF
  // },

  card: {
    backgroundColor: '#FFFFF',
    margin: 10,
    borderRadius: 8,
    borderColor: '#bfc9c2',
    borderWidth: 0.5,
    position: 'relative',
  },
  cardHeader: {flexDirection: 'row',padding: moderateScale(8),},

  nameRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
    marginBottom: 2,
    width:'90%',
    
  },
  patientName: {
    
    fontSize: 14,
    color: '#222',
    wordWrap: 'break-word',

  },
  genderAgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
 
  },
  genderBadge: {
    minWidth: 28,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(241,243,247,1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    paddingHorizontal: 6,
  },
  genderBadgeText: {
    color: '#222',
    fontSize: 14,
  
  },
  ageText: {
    fontSize: 14,
    color: '#222',
  },
  row: {
    flexDirection: 'row',
    marginTop: verticalScale(1),
    flexWrap: 'nowrap',
    
  },
  infoText: {
    backgroundColor: 'rgba(241,243,247,1)',
    marginRight: scale(10),
    borderRadius: moderateScale(4),
    textAlign:'center', 
    alignItems:'center',
    justifyContent:'center',
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  
  statusBadgeWrapper: {
    width: moderateScale(36),
    height: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 7,
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
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'SFPRODISPLAYREGULAR',
  },

  description: {
   
  },
  actionButton: { borderRadius: 5},
  actionButtonText: {
    // fontWeight: '400',
    textAlign: 'center',
  },
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
  
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  
  },
  emptyText: {
    padding: 10,
    textAlign: 'center',
    color: '#666',
  },
  dateTimeHeader: {
    backgroundColor: '#f8f9fa',
    padding: moderateScale(8),
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',

  },
  demographicType: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#0049F826'
  },
  reasonText: {
    padding: moderateScale(8),
    color: '#444'
  },
  doctorInfo: {

  },
  doctorName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  reasonLabel: {
    fontWeight: '600',
    color: '#333',
  },
  reasonDesc: {
    color: '#666',
    fontStyle: 'italic',
   
  },
  timeHeader: {
    backgroundColor: '#f8f9fa',

    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  phnLabel: {
    fontSize: 14,
   
   // Dark color for PHN label

  },
  phnValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666', // Faded color for PHN value
    fontFamily: 'Product Sans Regular',
  },
  eligibilityBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    position: 'absolute',
    right: moderateScale(40), // Adjust this value to position it correctly
    top: moderateScale(6),
  },
  eligibilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  IconContainer:{
    backgroundColor:'rgba(241,243,247,1)',
    width:35,
    height:35,
    borderRadius:10,
    justifyContent:'center',
    alignItems:'center',
  
  
    marginRight:10,
    borderRadius:20,
    
  },
  slashText: {
    color: '#888',
    fontWeight: 'normal',
    fontSize: 16,
    color: '#222',
  },
  timeInfoBox: {
    backgroundColor: 'rgba(241,243,247,1)',
    borderRadius: 4,
    paddingHorizontal: 8,
  
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

