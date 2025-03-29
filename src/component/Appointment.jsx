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
    dispatch(setSelectedAppointmentAndFetchDetails(appointment));
    
    navigation.navigate("Chat", {
      from: appointment.status === 'N' ? 'NEW' : 'FOLLOWUP',
      demographicNo: appointment.demographicNo,
      status: appointment.status
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
            borderColor: isNew ? '#0049F8' : 'grey',
          },
        ]}>
        <View style={styles.timeHeader}>
          <Text style={styles.appointmentTime}>
            {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
          </Text>
        </View>

        <View>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <PatientImage />
            </View>
            <View style={{flex: 1}}>
              <View style={styles.nameRow}>
                <Text variant="subheading" style={styles.patientName}>{item.patientName}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.infoText}>
                  <Text>
                    <Text  style={styles.phnLabel}>PHN: </Text>
                    <Text  style={styles.phnValue}>{item.clinicContact}</Text>
                  
                  </Text>
                </View>
                <View style={styles.infoText}>
                  <Text variant='paragraph'>{item.duration} mins</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.reasonText}>
            Reason: {item.reason}, {item.reasonDesc}
          </Text>
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
          
         
            <View style={[
              styles.eligibilityBadge,
              { backgroundColor: item.eligibility === "YES" ? '#E3F2FD' : '#FFEBEE' }
            ]}>
              <Text style={[
                styles.eligibilityText,
                { color: item.eligibility === "YES" ? '#0049F8' : '#D32F2F' }
              ]}>
                {item.eligibility === "YES" ? "Eligible" : "Not Eligible"}
              </Text>
            </View>
       
        </View>

        <TouchableOpacity
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
        </TouchableOpacity>
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
  line: {
    height: 1,
    backgroundColor: '#ddd',
    flex: 1,
    margin: 10,
  },

  card: {
    backgroundColor: '#FFF',
    margin: 10,
    borderRadius: 8,
    borderColor: '#0049F8',
    borderWidth: 1,
    position: 'relative',
  },
  cardHeader: {flexDirection: 'row', marginBottom: 5,padding: moderateScale(12),paddingBottom:5},
  avatar: {borderRadius: 25, marginRight: 10, marginBottom: 20},
  nameRow: {flexDirection: 'row', alignItems: 'center'},
  name: {
    // fontWeight: '700',
    marginRight: 5,
  },
  // genderIcon: {width: 14, height: 14},

  row: {
    flexDirection: 'row',
    marginTop: verticalScale(5),
    flexWrap: 'nowrap',
    marginBottom: verticalScale(5),
  },
  infoText: {
    backgroundColor: 'rgba(241,243,247,1)',
    marginRight: scale(10),
    marginBottom: verticalScale(5),
    borderRadius: moderateScale(4),
    padding: moderateScale(4),
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
    marginBottom: 10,
  },
  actionButton: {padding: 16, borderRadius: 5},
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
    padding: 4,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 15,
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
    marginTop: 4
  },
  patientName: {
  
    // color: '#333',
    marginRight: 8
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
    padding: moderateScale(12),
    color: '#444'
  },
  doctorInfo: {
    marginTop: verticalScale(4),
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
    marginTop: verticalScale(4),
  },
  timeHeader: {
    backgroundColor: '#f8f9fa',
    padding: moderateScale(8),
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  phnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191919', // Dark color for PHN label

  },
  phnValue: {
    fontSize: 16,
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
});

