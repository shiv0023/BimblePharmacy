import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import {
  AppointmentStatus,
  AppointmentStatus2,
  AppointmentUserIcon,
  MenuIcon,
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

const appointments = [
  {
    id: '1',
    name: 'Sophia Christopher',
    gender: 'F',
    age: 30,
    phone: '5436789567',
    status: 'N',
    description:
      'Experience Fatigue due to lack of sleep. There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.',
    avatar: <PatientFemaleImg />,
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
    avatar: <PatientImage />,
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
    avatar: <PatientImage />,
    genderIcon: 'https://example.com/icons/male.png',
  },
];

export default function Appointment({navigation}) {
  const [currentDate, setCurrentDate] = useState('');
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

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

  const renderItem = ({item}) => (
    <View
      style={[
        styles.card,
        {borderColor: item.status === 'N' ? '#0049F8' : 'grey'},
      ]}>
      <View style={{}}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>{item.avatar}</View>
          <View style={{flex: 1}}>
            <View style={styles.nameRow}>
              <Text variant="subheading">{item.name} {" "}</Text>
              {item.status === 'N' ? (
                <AppointmentStatus />
              ) : (
                <AppointmentStatus2 />
              )}
            </View>
            <View style={styles.row}>
              <View style={styles.infoText}>
                <Text style={{fontWeight: '400',fontSize:16}}>
                  <Text variant="base" style={{fontWeight: '700',fontSize:16}}>
                    PHN:
                  </Text>{' '}
                  {item.phone}
                </Text>
              </View>
              <View style={styles.infoText}>
                <Text
                 variant="paragraph" >
                  {item.gender}
                </Text>
              </View>
              <View style={styles.infoText}>
                <Text variant="paragraph">{item.age} Years</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'flex-start'}}>
          <View style={{width: '100%', height: 1, backgroundColor: '#0049F826',}} />
        </View>
        <Text variant="paragraph" style={{padding: moderateScale(12)}}>{item.description}</Text>
      </View>
      <View style={styles.statusBadgeWrapper}>
        <LinearGradient
          colors={
            item.status === 'N'
              ? ['#2968FF', '#0049F8']
              : ['#06D001', '#008D00']
          }
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.statusBadge}>
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
          navigation.navigate(item.status === 'N' ? 'Chat' : 'followupchat')
        }>
        <Text
          style={[
            styles.actionButtonText,
            {
              color: item.status === 'N' ? '#fff' : '#666',
            },
          ]}>
          {item.status === 'N' ? 'Continue' : 'Waiting'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <PanGestureHandler onGestureEvent={handleSwipe}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#0049F8" barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuIconWrapper}>
              <View>
                <MenuIcon onPress={() => navigation.openDrawer()} />
                {isSidebarVisible && (
                  <SidebarMenu onClose={() => setSidebarVisible(false)} />
                )}
              </View>
            </TouchableOpacity>
            <Text  variant ="pageHeading" style={styles.headerText}>Appointments</Text>
          </View>

        <TouchableOpacity>
          <AppointmentUserIcon style={styles.headerAvatar} />
        </TouchableOpacity>
      </View>

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

        {/* Appointment List */}
        <FlatList
          data={appointments.filter(item => (currentTabIndex === 0 ? item.status === 'N' : item.status === 'F'))}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      </View>
    </PanGestureHandler>
  );
}

const styles = ScaledSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa'},
  header: {
    backgroundColor: '#0049F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(15),
    paddingTop: Platform.OS === 'ios' ? moderateScale(45) : moderateScale(10),
    paddingBottom: moderateScale(10),
    minHeight: Platform.OS === 'ios' ? verticalScale(90) : verticalScale(70),
    width: '100%',
    position: 'relative',
    // zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconWrapper: {
    padding: moderateScale(5),
    minWidth: moderateScale(40),
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    // fontWeight: '700',
    marginLeft: moderateScale(0),
    marginTop: moderateScale(5),
    flexShrink: 1,
  },
  headerAvatar: {
    alignItems: 'center',
    padding: moderateScale(5),
    minWidth: moderateScale(40),
    justifyContent: 'center',
  },

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
    // fontWeight: '400',
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
});
