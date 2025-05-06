import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, ScrollView, TextInput, StatusBar, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { generateScopeAssessment } from '../Redux/Slices/GenerateAssessmentslice';
import { fetchPatientDetails } from '../Redux/Slices/PatientDetailsSlice';
import Feather from 'react-native-vector-icons/Feather';

import CustomHeader from './CustomHeader';
import AcneScopeAssessment from './ScopeAssessment';
import { Call } from './svgComponent';
import { generateFollowupAssessment } from '../Redux/Slices/FollowUpAssessmentSlice';
import { HeadersInner } from './HeaderIneer';
import DrugPrescription from './DrugPrescription';
import TickIcon from '../Utils/SvgComponent';

const { width } = Dimensions.get('window');

const Chat = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { 
    demographicNo, 
    gender, 
    ageString, 
    year_of_birth, 
    month_of_birth, 
    date_of_birth,
    reason,
    date,
    reasonDesc,
    startTime,
    patientName,
    phn
  } = route.params || {};
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentData, setAssessmentData] = useState({
    age: '',
    acneAfter30: false,
    familyHistory: false,
    newMedications: false,
    anxious: false,
    locations: [],
    notAcne: false,
    symptoms: false,
    acneType: [],
    spotCount: '',
    confident: false,
    whiteheadsBlackheads: false
  });
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [preAssessmentAnswers, setPreAssessmentAnswers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientDetails, setPatientDetails] = useState(null);
  const [followupAssessmentDone, setFollowupAssessmentDone] = useState(false);
  const [prescriptionDone, setPrescriptionDone] = useState(false);
  const [scopeStatus, setScopeStatus] = useState(null);

  const getFullGender = (gender) => {
    if (!gender) return '';
    if (gender.toUpperCase() === 'F') return 'Female';
    if (gender.toUpperCase() === 'M') return 'Male';
    return gender;
  };

  const getShortGender = (gender) => {
    if (!gender) return 'N/A';
    if (gender.toLowerCase() === 'female') return 'F';
    if (gender.toLowerCase() === 'male') return 'M';
    return gender;
  };

  useEffect(() => {
    // Log the complete route params
    console.log('Complete route params:', route.params);
    
    // Validate demographicNo format
    if (demographicNo) {
      console.log('DemographicNo type:', typeof demographicNo);
      console.log('DemographicNo value:', demographicNo);
    } else {
      console.warn('DemographicNo is missing from route params');
    }
  }, []);

  useEffect(() => {
    if (demographicNo) {
      dispatch(fetchPatientDetails({ demographicNo }));
    }
  }, [dispatch, demographicNo]);

  console.log('Route Params:', {
    date,
    reason,
    reasonDesc,
    startTime,
    gender,
    demographicNo,

    rawParams: route.params
  });

  const handlePreAssessment = async () => {
    try {
      // Format parameters
      const formattedParams = {
        reason: String(reason || '').trim(),
        gender: getFullGender(gender)
      };

      console.log('Sending formatted params:', formattedParams);

      // Make the API call
      const result = await dispatch(generateScopeAssessment(formattedParams)).unwrap();

      if (result?.data) {
        setAssessmentQuestions(result.data);
        setShowAssessment(true);
      }
    } catch (error) {
      console.error('Failed to generate assessment:', error);
    }
  };

  const handleSubmitAssessment = async (data) => {
    try {
      const { result, formattedPayload, scopeStatus: statusFromAssessment } = data;

      setPreAssessmentAnswers({
        reason: formattedPayload.reason,
        scopeAnswers: formattedPayload.scopeAnswers,
        gender: formattedPayload.gender,
        dob: formattedPayload.dob,
        scope: statusFromAssessment
      });

      // Set the scope status for display
      setScopeStatus(statusFromAssessment);

      setShowAssessment(false);

      if (statusFromAssessment && statusFromAssessment.toLowerCase().includes('out of scope')) {
        navigation.navigate('SoapNotes', {
          demographicNo,
          scopeStatusReason: statusFromAssessment,
          gender,
          dob: formattedPayload.dob,
          phn
        });
      } else {
        handleFollowupAssessment();
      }
    } catch (error) {
      // handle error
    }
  };

  const handleFollowupAssessment = () => {
    // if (!preAssessmentAnswers) {
    //   Alert.alert('Error', 'Please complete the pre-assessment first');
    //   return;
    // }

    const formattedAnswers = Object.entries(preAssessmentAnswers.scopeAnswers).map(([question, answer], index) => ({
      questionId: index + 1,
      question: question,
      answer: String(answer)
    }));

    const params = {
      gender: preAssessmentAnswers.gender,
      dob: `${year_of_birth}-${month_of_birth}-${date_of_birth}`,
      condition: preAssessmentAnswers.reason || reason,
      appointmentNo: route.params?.appointmentNo || demographicNo,
      scope: preAssessmentAnswers.scope,
      answers: formattedAnswers,
      phn: phn,
      scopeAssessment: {
        reason: preAssessmentAnswers.reason,
        scopeAnswers: preAssessmentAnswers.scopeAnswers,
        gender: preAssessmentAnswers.gender,
        scope: preAssessmentAnswers.scope
      }
    };

    navigation.navigate('FollowUpAssessment', params);
  };

  // Format date as needed
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  // Add the same helper function
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

  const BUTTON_WIDTH = (width - 60) / 4; // Adjust 60 for margins/paddings
  const buttonSize = Math.floor((width - 60) / 4); // Or any size you want, e.g., 90

  // Add this helper function
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Add the renderPatientInfo function
  const renderPatientInfo = () => {
    const patientAge = route.params?.age || calculateAge(`${year_of_birth}-${month_of_birth}-${date_of_birth}`);
    const isNew = reason === 'New Patient' || reason === 'New';
    const phnNumber = route.params?.phn || demographicNo;

    return (
      <View style={[
        styles.patientInfo,
        {
          backgroundColor: isNew 
            ? "rgba(223, 233, 252, 1)" 
            : "rgba(220,232,221,1)",
          marginTop: 0,
          borderRadius: 0,
          paddingVertical: 16,
        }
      ]}>
        <Text style={styles.patientInfoText}>
          <Text style={styles.phnLabel}>PHN: </Text>
          <Text style={styles.phnValue}>
            {`${phn} / ${getShortGender(gender)} / ${patientAge} Years`}
          </Text>
        </Text>
        <View style={[
          styles.newButtonContainer,
          {
            backgroundColor: isNew ? "#0057FF" : "#008D00",
            borderRadius: 6
          }
        ]}>
          <Text style={[styles.newButton, { fontSize: 10 }]}>
            {isNew ? 'New' : 'Followup'}
          </Text>
        </View>
      </View>
    );
  };

  const getScopeStatusLabel = (status) => {
    if (!status) return null;
    const lower = status.toLowerCase();
    if (lower.includes('in scope')) {
      return { label: 'In Scope', bgColor: '#27ae60' }; // green
    }
    if (lower.includes('refer') || lower.includes('out of scope')) {
      return { label: 'Refer', bgColor: '#e74c3c' }; // red
    }
    return null;
  };

  return (
    <>
      <StatusBar
        backgroundColor="#0049F8"
        barStyle="light-content"
        translucent={false}
      />
      {Platform.OS === 'ios' && (
        <View style={{ height: 44, backgroundColor: '#0049F8' }}>
          <StatusBar barStyle="light-content" />
        </View>
      )}
      {Platform.OS === 'android' && (
        <StatusBar backgroundColor="#0049F8" barStyle="light-content" />
      )}
      <SafeAreaView style={styles.container}>
        {showAssessment ? (
          <AcneScopeAssessment 
            questions={assessmentQuestions}
            onSubmit={handleSubmitAssessment}
            onCancel={() => setShowAssessment(false)}
            assessmentData={assessmentData}
            setAssessmentData={setAssessmentData}
            gender={gender}
            reason={reason}
            ageString={ageString}
            year_of_birth={year_of_birth}
            month_of_birth={month_of_birth}
            date_of_birth={date_of_birth}
            dob={`${year_of_birth}-${month_of_birth}-${date_of_birth}`}
          />
        ) : (
          <>
            <CustomHeader 
              title={patientName ? patientName.replace(/,/g, ' ').trim() : "SCOPE ASSESSMENT"} 
              IconComponent={Call} 
            />
            
            {/* Add the patient info section here */}
            {renderPatientInfo()}

            {/* Date with lines */}
            <View style={styles.dateRow}>
              <View style={styles.line} />
              <Text style={styles.dateText}>{formattedDate}</Text>
              <View style={styles.line} />
            </View>

            {/* Message bubble */}
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>
                {reason && `${reason}`}
                {reasonDesc && `, ${reasonDesc}`}
              </Text>
              {scopeStatus && getScopeStatusLabel(scopeStatus) && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{
                    fontWeight: '350',
                    color: '#fff',
                    fontSize: 12,
                    alignSelf: 'flex-start',
                    backgroundColor: getScopeStatusLabel(scopeStatus).bgColor,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    overflow: 'hidden'
                  }}>
                    {getScopeStatusLabel(scopeStatus).label}
                  </Text>
                </View>
              )}
            </View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Footer buttons */}
            <View style={styles.footerRowWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.footerRow}
              >
                <TouchableOpacity 
                  style={[styles.footerButton, { width: 130, height: 130 }]}
                  onPress={handlePreAssessment}
                >
                  {preAssessmentAnswers && (
                    <View style={styles.checkmarkContainer}>
                      <TickIcon />
                    </View>
                  )}
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.footerButtonText}>
                      Pre{'\n'}Assessment
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.footerButton, 
                    { width: 130, height: 130 },
                    !preAssessmentAnswers && styles.footerButtonDisabled
                  ]}
                  onPress={() => {
                    handleFollowupAssessment();
                  }}
                  disabled={!preAssessmentAnswers}
                >
                  {followupAssessmentDone && (
                    <View style={styles.checkmarkContainer}>
                      <TickIcon />
                    </View>
                  )}
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.footerButtonText}>
                      Followup{'\n'}Assessment
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.footerButton, 
                    { width: 130, height: 130 },
                    (!preAssessmentAnswers || !followupAssessmentDone) && styles.footerButtonDisabled
                  ]}
                  onPress={() => {
                    if (!preAssessmentAnswers || !followupAssessmentDone) {
                      Alert.alert('Error', 'Please complete the previous steps first');
                      return;
                    }
                    navigation.navigate('DrugPrescription', {
                      demographicNo: demographicNo,
                      condition: preAssessmentAnswers.reason || reason,
                      gender: gender,
                      dob: `${year_of_birth}-${month_of_birth}-${date_of_birth}`,
                      phn: phn,
                    });
                  }}
                  disabled={!preAssessmentAnswers || !followupAssessmentDone}
                >
                  {prescriptionDone && (
                    <View style={styles.checkmarkContainer}>
                      <TickIcon />
                    </View>
                  )}
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.footerButtonText}>
                      Generate{'\n'}Prescription
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.footerButton, 
                    { width: 130, height: 130 },
                    (!preAssessmentAnswers || !followupAssessmentDone || !prescriptionDone) && styles.footerButtonDisabled
                  ]}
                  onPress={() => {
                    if (!preAssessmentAnswers || !followupAssessmentDone || !prescriptionDone) {
                      Alert.alert('Error', 'Please complete the previous steps first');
                      return;
                    }
                    // Your SOAP Notes logic here
                  }}
                  disabled={!preAssessmentAnswers || !followupAssessmentDone || !prescriptionDone}
                >
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.footerButtonText}>
                      Generate{'\n'}SOAP Notes
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 18,
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#bbb',
    marginHorizontal: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '300',
    textAlign: 'center',
    minWidth: 120,
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbb',
    marginHorizontal: 18,
    padding: 16,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 16,
    color: '#222',
    textAlign: 'left',
    lineHeight: 24,
    fontWeight:'300',
  },
  footerRowWrapper: {
    marginHorizontal: 0,
    marginBottom: 4,
   
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  footerButton: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 16,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    position: 'relative',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextContainer: {
    position: 'absolute',
    bottom: 18,
    left: 6,
    
    
  },
  footerButtonText: {
    fontSize: 15,
    color: '#222',
    textAlign: 'left',
    fontWeight: '300',
    lineHeight:17
   
   
  },
  footerButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  checkboxGroup: {
    marginTop: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#0049F8',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#0049F8',
    borderRadius: 2,
  },
  checkboxText: {
    fontSize: 16,
    color: '#222',
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonSelected: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  buttonText: {
    fontSize: 16,
    color: '#222',
  },
  buttonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#222',
    fontSize: 18,
    fontWeight: '500',
  },
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(220,232,221,1)',
    width: '100%',
    height:60
  },
  patientInfoText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phnLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  phnValue: {
    fontSize: 16,
    color: '222',

    fontWeight:'200'
  },
  newButtonContainer: {
    backgroundColor: '#008D00',
    borderRadius: 6,

    minWidth: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButton: {
    color: '#fff',
    fontSize: 6,
    fontWeight: '400',
    textAlign: 'center',
  },
  errorText: {
    color: '#666',
    fontSize: 14,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 5,
    left: 5,
    zIndex: 10,
  },
  scopeStatusContainer: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b2dfdb',
  },
  scopeStatusText: {
    fontSize: 15,
    color: 'white',
    fontWeight: '400',
  },
});

export default Chat;

