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





// Get window dimensions
const { width, height } = Dimensions.get('window');

function formatPatientName(name) {
  // Ensure a single space after each comma and convert to uppercase
  return name.replace(/,\s*/g, ', ').toUpperCase();
}

function getFullGender(gender) {
  if (!gender) return '';
  if (gender.toUpperCase() === 'F') return 'Female';
  if (gender.toUpperCase() === 'M') return 'Male';
  return gender;
}

const formatTime = (timeString) => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  
  if (hour === 12) {
    return `${hours}:${minutes} PM`;
  } else if (hour > 12) {
    return `${hour - 12}:${minutes} PM`;
  } else if (hour === 0) {
    return `12:${minutes} AM`;
  } else {
    return `${hour}:${minutes} AM`;
  }
};

function getAgeString(year, month, day) {
  if (!year || !month || !day) return '';
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years} years${months > 0 ? ` ${months} months` : ''}`;
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

  const handleAppointmentPress = (item) => {
    // Format DOB
    const dob = `${item.year_of_birth}-${item.month_of_birth}-${item.date_of_birth}`;
    
    // Format demographicNo
    const formattedDemographicNo = String(item.demographicNo).replace(/\D/g, '');
    
    const ageString = getAgeString(item.year_of_birth, item.month_of_birth, item.date_of_birth);
    
    console.log('Navigating with params:', {
      demographicNo: formattedDemographicNo,
      reason: item.reason,
      gender: getFullGender(item.gender),
      ageString,
      year_of_birth: item.year_of_birth,
      month_of_birth: item.month_of_birth,
      date_of_birth: item.date_of_birth,
      dob: dob,
    });
    
    navigation.navigate("Chat", {
      date: item.appointmentDate,
      reason: item.reason,
      reasonDesc: item.reasonDesc || "This is reason description there is more to this description....",
      demographicNo: formattedDemographicNo,
      status: item.status,
      appointmentNo: item.appointmentNo,
      deliveryMethod: item.deliveryMethod,
      gender: getFullGender(item.gender),
      year_of_birth: item.year_of_birth,
      month_of_birth: item.month_of_birth,
      date_of_birth: item.date_of_birth,
      dob: dob,
      ageString,
      patientName: item.patientName,
      phn: item.phn,
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
                <Text  style={styles.patientName} numberOfLines={2}>
                  {formatPatientName(item.patientName)}
                </Text>
                
              </View>
              <View style={styles.genderAgeInline}>
                <Text style={styles.genderBadgeText}>{getFullGender(item.gender)}</Text>
                <Text style={styles.slashText}> / </Text>
                <Text style={styles.ageText}>{item.age} years</Text>
                </View>
                
              <View style={styles.row}>
                {/* <View>
                  <Text>
                    <Text style={styles.phnLabel}>PHN: </Text>
                    <Text variant="subheading" style={styles.phnValue}>{item.phn
                    }</Text>
                  </Text>
                </View> */}
                <View style={styles.timeInfoBox}>
              
                </View>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',  
            paddingBottom: 2, 
            paddingTop: 2 
          }}>
            <View style={{flex: 1}}>
              {/* Start time and demographic type row */}
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',paddingHorizontal:2}}>
                {/* Time on the left */}
                <View style={{flexDirection: 'row', alignItems: 'center',marginLeft:6}}>
                  <Icon name="clock-outline" size={16} color="#222" style={{marginRight: 4}} />
                  <Text style={styles.appointmentTime}>
                    {formatTime(item.startTime)}
                  </Text>
                </View>
              
                <Text style={{
                  fontSize: 15,
                  color: '#aaa',
                  fontWeight: '400',
                  textAlign: 'right',
                  marginRight:8,
                  fontFamily:'Product Sans Italic',
              
                }}>
                  {(item.demographicType ||'').replace(/-/g,'')}
                </Text>
              </View>
              
           

              {/* Reason Description + Arrow Icon in a row */}
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',marginBottom:'6'}}>
                <Text style={styles.reasonText} numberOfLines={2}>
                {item.reason}, {item.reasonDesc }
                </Text>
                <View style={styles.IconContainer}>
                  <TouchableOpacity onPress={() => handleAppointmentPress(item)}>
                    <Icon name="arrow-top-right" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          
        </View>

       

      
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
                <Text style={[styles.tabText, { textAlign: 'center',alignContent:'center',justifyContent:'center' }]}>{tab}</Text>
                {currentTabIndex === index && <View style={styles.activeTab}></View>}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tabSeparator} />

          {/* Current Date */}
          <View style={styles.dateWrapper}>
            <View style={styles.line} />
            <Text style={styles.dateText}>{currentDate}</Text>
            <View style={styles.line} />
          </View>

          {userData.length > 0 ? (
            <FlatList
              data={userData.filter(item => {
                const today = getCurrentDate();
                const itemDate = item.appointmentDate;
                const demographicType = (item.demographicType || '').toLowerCase();
                
                // Skip cancelled appointments
                if (item.status === 'Cancelled') {
                  return false;
                }
                
                if (currentTabIndex === 0) {
                  // Today's appointments: show if not follow-up and date is today
                  return itemDate === today && demographicType !== 'follow-up';
                } else {
                  // Upcoming appointments: show if follow-up or date is after today
                  return demographicType === 'follow-up' || itemDate > today;
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
    justifyContent: 'center',
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
    textAlign: 'center',
   
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
    lineHeight:14.2,
    fontSize:12,
    fontWeight:'400',
    color:'#222',
    fontFamily:'Product Sans Regular',
    
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
   
    width:'90%',
    
  },
  patientName: {
fontWeight:'400',
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
    fontWeight:'300',
  },
  ageText: {
    fontSize: 14,
    color: '#222',
    fontWeight:'300',
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
    color: '#222',
    fontWeight:'300',
  },
  demographicType: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    
   
 
  },
  divider: {
    width: '100%',
    height: 2,
    backgroundColor: '#e8e6df'
  },
  reasonText: {
  marginLeft:6,
    fontSize: 14,
    color: '#222',
   fontWeight:'300',
    width:'85%',
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
    color: '#888',
    fontSize: 1,
    fontStyle: '',
    marginTop: 2,
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
    backgroundColor:'#0049F8',
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

