import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
} from 'react-native';
import  {Call,AppointmentUserIcon, PatientFemaleImg} from './svgComponent';
import {FileIcon, MenuIcon, Union, Union2} from './svgComponent';
import CustomHeader from './CustomHeader';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatientDetails, fetchEncounterNotes } from '../Redux/Slices/PatientDetailsSlice';
import { addPatientDrug } from '../Redux/Slices/DrugSlice';

const { width } = Dimensions.get('window');

// Add this function at the top of your file, outside the component
const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  
  // Parse the date of birth
  const birthDate = new Date(dob);
  const today = new Date();
  
  // Calculate the age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const Chat = ({navigation}) => {
  const dispatch = useDispatch();
  const routes = useRoute();
  const navigationNav = useNavigation();
  
  const selectedAppointment = useSelector(state => state?.appointment?.selectedAppointment);
  const patientDetails = useSelector(state => state?.auth?.patientDetails?.data);
  const encounterNotes = useSelector(state => state?.auth?.patientDetails?.encounterNotes || []);
  const loading = useSelector(state => state?.patientDetails?.loading);
  const notesLoading = useSelector(state => state?.patientDetails?.notesLoading);

  const chatType = routes.params?.status === 'N' ? 'NEW' : 'FOLLOWUP';

  const [isPrescribing, setIsPrescribing] = useState(false);

  useEffect(() => {
    const demoNo = selectedAppointment?.demographicNo || routes.params?.demographicNo;
    
    if (demoNo) {
      dispatch(fetchPatientDetails({ demographicNo: demoNo }));
      dispatch(fetchEncounterNotes({ demographicNo: demoNo }))
        .unwrap()
        .catch(error => {
          // Keep error handling without console.error
        });
    }
  }, [dispatch, selectedAppointment, routes.params, chatType]);

  const transformedMessages = React.useMemo(() => {
    if (!encounterNotes || encounterNotes.length === 0) {
      return [];
    }

    const sortedAppointments = [...encounterNotes].sort((a, b) => 
      new Date(a.appointment_date) - new Date(b.appointment_date)
    );

    return sortedAppointments.flatMap(appointment => {
      const messages = [];

      // Patient's initial message with reason
      if (appointment.reason || appointment.reasonDesc) {
        messages.push({
          id: `patient-${appointment.appointment_no}-reason`,
      type: 'patient',
          text: appointment.reason || '',
          description: appointment.reasonDesc || '',
          timestamp: appointment.appointment_date,
          isDoctor: false,
          hasFiles: false
        });
      }

      // Doctor's notes message
      if (appointment.notesData && appointment.notesData.length > 0) {
        messages.push({
          id: `doctor-${appointment.appointment_no}-notes`,
      type: 'doctor',
          notes: appointment.notesData,
          timestamp: appointment.appointment_date,
          isDoctor: true,
          hasFiles: false
        });
      }

      // Patient's images message (if any)
      if (appointment.problemPics && appointment.problemPics.length > 0) {
        messages.push({
          id: `patient-${appointment.appointment_no}-files`,
      type: 'patient',
          text: 'Attached Images',
          images: appointment.problemPics,
          timestamp: appointment.appointment_date,
          isDoctor: false,
          hasFiles: true
        });
      }

      return messages;
    });
  }, [encounterNotes]);

  const renderMessage = ({item}) => {
    // Format the date
    const formattedDate = item.timestamp ? 
      new Date(item.timestamp).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) 
      : 'No date';

    const DateContainer = () => (
      <View style={styles.messageDateContainer}>
        <View style={styles.dateLine} />
        <Text style={styles.messageDate}>{formattedDate}</Text>
        <View style={styles.dateLine} />
      </View>
    );

    if (item.isDoctor) {
      return (
        <View>
          <DateContainer />
          <View style={[styles.messageContainer, styles.doctorMessageContainer]}>
            <View style={styles.messageContent}>
              <View style={[styles.messageBox, styles.doctorMessage]}>
                {item.notes && item.notes.map((note, index) => (
                  <View key={index}>
                    <Text style={[styles.messageText, styles.doctorText]}>
                      {note.note}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <AppointmentUserIcon style={styles.profileImage} />
          </View>
        </View>
      );
    } else {
      return (
        <View>
          <DateContainer />
          <View style={[styles.messageContainer, styles.patientMessageContainer]}>
            <PatientFemaleImg style={styles.profileImage} />
            <View style={styles.messageContent}>
              <View style={[styles.messageBox, styles.patientMessage]}>
                <Text style={[styles.messageText, styles.patientText]}>
                  {item.text}
                </Text>
                {item.description && (
                  <Text style={[styles.descriptionText, styles.patientText]}>
                    {item.description}
                  </Text>
                )}
                {item.hasFiles && item.images && (
                  <View style={styles.imageGrid}>
                    {item.images.map((imageUrl, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.imageContainer}
                        onPress={() => navigation.navigate('ImageViewer', { uri: imageUrl })}
                      >
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.attachedImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      );
    }
  };

  useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('light-content');
    } else {
      StatusBar.setBackgroundColor('#0057FF');
      StatusBar.setBarStyle('light-content');
    }
  }, []);

  const openPDF = ({uri}) => {
  
    navigation.navigate('PDFViewer', { uri });

  };

  const renderPatientInfo = () => {
    if (loading) {
      return (
        <View style={[styles.patientInfo, { justifyContent: 'center' }]}>
          <ActivityIndicator size="small" color="#0057FF" />
        </View>
      );
    }

    if (!patientDetails) {
      return (
        <View style={styles.patientInfo}>
          <Text style={styles.errorText}>No patient data available</Text>
        </View>
      );
    }

    const patientAge = calculateAge(patientDetails.dob);
    const isNew = routes.params?.status === 'N';

    return (
      <View style={[
        styles.patientInfo,
        {
          backgroundColor: isNew 
            ? "rgba(223, 233, 252, 1)" 
            : "rgba(220,232,221,1)"
        }
      ]}>
        <Text style={styles.patientInfoText}>
          <Text style={styles.phnLabel}>PHN:</Text>{' '}
          <Text style={{color: 'black', fontSize: 18}}>
            {`${patientDetails?.phn || 'N/A'} / ${patientDetails?.gender || 'N/A'} / ${patientAge} Years`}
          </Text>
        </Text>
        <View style={[
          styles.newButtonContainer,
          {
            backgroundColor: isNew ? "#0057FF" : "#008D00",
            paddingHorizontal: isNew ? 12 : 8  // Adjust padding for longer text
          }
        ]}>
          <Text variant='accent' style={styles.newButton}>
            {isNew ? 'New' : 'FollowUp'}
          </Text>
        </View>
    </View>
  );
  };

  useEffect(() => {
    if (patientDetails?.dob) {
      console.log('Patient DOB:', patientDetails.dob);
      console.log('Calculated Age:', calculateAge(patientDetails.dob));
    }
  }, [patientDetails]);

  useEffect(() => {
    console.log('Selected Appointment:', selectedAppointment);
    console.log('Encounter Notes:', encounterNotes);
    console.log('Appointment Date:', selectedAppointment?.appointment_date);
  }, [selectedAppointment, encounterNotes]);

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const phoneURL = `tel:${formattedNumber}`;

    Linking.canOpenURL(phoneURL)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        } else {
          return Linking.openURL(phoneURL);
        }
      })
      .catch(err => {
        Alert.alert('Error', 'Failed to make phone call');
      });
  };

  const handleStartAssessment = () => {
    // Get relevant patient info from the current appointment
    const assessmentData = {
      patientId: patientDetails?.demographicNo,
      patientName: `${patientDetails?.firstName} ${patientDetails?.lastName}`,
      appointmentReason: selectedAppointment?.reason,
      appointmentDesc: selectedAppointment?.reasonDesc,
      appointmentDate: selectedAppointment?.appointment_date,
      chatType: chatType
    };

    navigationNav.navigate('Assessment', assessmentData);
  };

  const handleWritePrescription = () => {
    if (!patientDetails?.demographicNo) {
      Alert.alert('Error', 'Patient information is missing');
      return;
    }

    const prescriptionData = {
      demographicNo: parseInt(patientDetails.demographicNo),
      drugData: [{
        indication: "Wound disinfection",
        instructions: "",
        duration: "",
        quantity: "",
        repeat: "",
        groupName: "",
        drugForm: "",
        dosage: "",
        startDate: new Date().toISOString().split('T')[0],
        longTerm: null
      }]
    };

    navigation.navigate('Prescription', {
      patientDetails: {
        demographicNo: parseInt(patientDetails.demographicNo),
        firstName: patientDetails.firstName,
        lastName: patientDetails.lastName,
        phn: patientDetails.phn,
        dob: patientDetails.dob
      },
      prescriptionData: prescriptionData
    });
  };

  return (
    <>
      {Platform.OS === 'ios' && (
        <SafeAreaView style={styles.statusBarBackground} />
      )}
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: chatType === 'NEW' ? '#fff' : '#fff' }
      ]}>
        <StatusBar
          translucent={false}
          backgroundColor="#0049F8"
          barStyle="light-content"
        />
        <CustomHeader 
          title={patientDetails ? `${patientDetails.firstName || ''} ${patientDetails.lastName || ''}` : "Loading..."} 
          phoneNumber={patientDetails?.clinicContact || ''} 
          IconComponent={Call}
          chatType={chatType}
          onCall={() => handleCall(patientDetails?.clinicContact)}
        />

        {renderPatientInfo()}

        <View style={styles.dateContainer}>
          <View style={styles.line} />
          <Text style={styles.dateText}>
            {selectedAppointment?.appointment_date ? 
              new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
              : encounterNotes && encounterNotes[0]?.appointment_date ? 
                new Date(encounterNotes[0].appointment_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
                : 'No date available'
            }
          </Text>
          <View style={styles.line} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0057FF" />
          </View>
        ) : (
        <FlatList
            data={transformedMessages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderMessage}
          style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
        />
        )}

<View style={styles.footer}>
  <View style={styles.footerButtonContainer}>
            <TouchableOpacity 
              style={[styles.footerButton, styles.assessmentButton]}
              onPress={handleStartAssessment}
            >
      <Union style={styles.footerIcon} />
      <Text style={styles.footerButtonText}>
        Start{'\n'}Assessment
      </Text>
    </TouchableOpacity>
  </View>
  <View style={styles.footerButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.footerButton,
                isPrescribing && styles.footerButtonDisabled
              ]}
              onPress={handleWritePrescription}
              disabled={isPrescribing}
            >
              {isPrescribing ? (
                <ActivityIndicator size="small" color="#0049F8" />
              ) : (
                <>
      <Union2 style={styles.footerIcon} />
      <Text style={styles.footerButtonText}>
        Write{'\n'}Prescription
      </Text>  
                </>
              )}
    </TouchableOpacity>
  </View>
</View>
      </SafeAreaView>
    </>
  );
};

const additionalStyles = {
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 8,
  },
  messageContent: {
    flex: 1,
    marginHorizontal: 8,
  },
  messageBox: {
    padding: 12,
    maxWidth: '75%',
    borderRadius: 20,
  },
  doctorMessage: {
    backgroundColor: '#0057FF',
    alignSelf: 'flex-end',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  patientMessage: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248, 94, 173, 0.4)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  doctorText: {
    color: '#FFF',
  },
  patientText: {
    color: '#191919',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  attachmentIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  attachmentText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: 4,
  },
  fileContainer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 94, 173, 0.4)',
    marginBottom: 4
  },
  fileName: {
    fontSize: 12,
    color: '#191919',
    marginLeft: 6,
    fontWeight: '400'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  footerButtonContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent:'space-between',
    margin:10
  },
  footerButton: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent:'space-between',
    borderWidth: 1,
    borderColor: '#E6E8EC',
    borderRadius: 20,
    gap:30,
    paddingTop: 28,
    paddingBottom: 18,
    paddingLeft: 18,
    paddingRight: 18,
    marginHorizontal: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 2,
  },
  footerIcon: {
    marginBottom: 5,
    width: 24,
    height: 24,
  },
  footerButtonText: {
    textAlign: 'left',
    fontWeight:500,
    fontSize:18,
    fontFamily:'SF Pro Display'
  },
  errorText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Product Sans Regular',
  },
  messageHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Product Sans Regular',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
    fontFamily: 'Product Sans Regular',
  },
  messageListContent: {
    paddingBottom: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noteItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  noteMetadata: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  noteProvider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  fileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  patientFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 94, 173, 0.4)',
    minWidth: '45%',
  },
  fileIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  patientFileName: {
    color: '#191919',
    fontSize: 14,
  },
  messageDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  messageDate: {
    fontSize: 13,
    color: '#666666',
    paddingHorizontal: 12,
    fontFamily: 'Product Sans Regular',
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  messageContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-start',
  },
  imageContainer: {
    width: '48%', // Adjust this value to control image size
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(248, 94, 173, 0.4)',
  },
  attachedImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  footerButtonDisabled: {
    opacity: 0.7,
  },
  prescriptionSuccess: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  prescriptionSuccessText: {
    color: '#2E7D32',
    fontSize: 14,
    fontFamily: 'Product Sans Regular',
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: width > 600 ? 0 : 0,
  },
  statusBarBackground: {
    backgroundColor: '#0057FF',
  },
  
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    gap:8
    // backgroundColor: 'rgba(223, 233, 252, 1)',
  },
  patientInfoText: {
    fontSize: 15,
    color: '#666',
  },
  phnLabel: {
    color: '#191919',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'SFPRODISPLAYLIGHTITALIC',
  },
  newButtonContainer: {
    backgroundColor: '#0057FF',
    borderRadius: 4,
    paddingVertical: 4,
    minWidth: 70,
    
  },
  newButton: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dateText: {
    marginHorizontal: 12,
    color: '#191919',
    fontSize: 15,
    fontWeight: '450',
    fontFamily: 'Product Sans Regular',
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 16,
    
  },
  doctorMessageContainer: {
    justifyContent: 'flex-end',
  },
  patientMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  messageBox: {
    padding: 12,
    maxWidth: '80%',
    borderRadius: 20,
  },
  doctorMessage: {
    backgroundColor: '#0057FF',
    alignSelf: 'flex-end',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  patientMessage: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248, 94, 173, 0.4)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  doctorText: {
    color: '#FFF',
  },
  patientText: {
    color: '#191919',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  attachmentIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  attachmentText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  fileContainer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 94, 173, 0.4)',
    marginBottom: 4
  },
  fileName: {
    fontSize: 12,
    color: '#191919',
    marginLeft: 6,
    fontWeight: '400'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  footerButtonContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent:'space-between',
    margin:10
  },
  footerButton: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent:'space-between',
    borderWidth: 1,
    borderColor: '#E6E8EC',
    borderRadius: 20,
    gap:30,
    paddingTop: 28,
    paddingBottom: 18,
    paddingLeft: 18,
    paddingRight: 18,
    marginHorizontal: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 2,
  },
  footerIcon: {
    marginBottom: 5,
    width: 24,
    height: 24,
  },
  footerButtonText: {
    textAlign: 'left',
    fontWeight:500,
    fontSize:18,
    fontFamily:'SF Pro Display'
  },
  errorText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Product Sans Regular',
  },
  messageHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Product Sans Regular',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
    fontFamily: 'Product Sans Regular',
  },
  messageListContent: {
    paddingBottom: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noteItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  noteMetadata: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  noteProvider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  fileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  patientFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 94, 173, 0.4)',
    minWidth: '45%',
  },
  fileIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  patientFileName: {
    color: '#191919',
    fontSize: 14,
  },
  ...additionalStyles
});

export default Chat;

