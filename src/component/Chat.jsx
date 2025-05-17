import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, ScrollView, TextInput, StatusBar, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { generateScopeAssessment } from '../Redux/Slices/GenerateAssessmentslice';
import { fetchPatientDetails, fetchEncounterNotes, clearEncounterNotes } from '../Redux/Slices/PatientDetailsSlice';
import Feather from 'react-native-vector-icons/Feather';
import Pdf from 'react-native-pdf';

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
    phn,
    subdomain,
  } = route.params || {};
  console.log('Subdomain in Chat screen:', subdomain);
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
  const [followUpAnswers, setFollowUpAnswers] = useState(null);
  const [scopeAnswers, setScopeAnswers] = useState(null);
  const [appointmentNo, setAppointmentNo] = useState(null);
  const [scope, setScope] = useState(null);
  const [soapNotesDone, setSoapNotesDone] = useState(false);
  const encounterNotes = useSelector(state => state.auth?.patientDetails?.encounterNotes || []);
  const notesLoading = useSelector(state => state.patientDetails?.notesLoading || false);
  const pdfPath = route.params?.pdfPath;
  const [showPdf, setShowPdf] = useState(false);
  const [isPreAssessmentDone, setIsPreAssessmentDone] = useState(false);
console.log (encounterNotes,'encounter')
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

  useEffect(() => {
    if (demographicNo) {
      dispatch(fetchEncounterNotes({ demographicNo }));
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

  useEffect(() => {
    if (route.params?.remarks) {
      // If we have remarks, set the scope status and mark pre-assessment as done
      const scopeAnswersFromRemarks = {
        // Add any default answers based on the remarks
        condition: route.params.reason ,
        status: route.params.remarks
      };

      setScopeStatus(route.params.remarks);
      setIsPreAssessmentDone(true);
      
      // Set pre-assessment answers with the basic info and scope answers
      setPreAssessmentAnswers({
        reason: reason,
        scopeAnswers: scopeAnswersFromRemarks,
        gender: gender,
        dob: `${year_of_birth}-${month_of_birth}-${date_of_birth}`,
        scope: route.params.remarks
      });

      // Also set assessment data for consistency
      setAssessmentData(scopeAnswersFromRemarks);
    }
  }, [route.params?.remarks]);

  const handlePreAssessment = async () => {
    if (isPreAssessmentDone) {
      Alert.alert('Info', 'Pre-assessment has already been completed for this appointment.');
      return;
    }

    try {
      // Format parameters
      const formattedParams = {
        reason: String(reason || '').trim(),
        gender: getFullGender(gender),
        subdomain: subdomain 
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
      console.log('Received scope status:', statusFromAssessment); // Debug log

      if (!statusFromAssessment) {
        console.error('No scope status received from assessment');
        Alert.alert('Error', 'Failed to get scope status from assessment');
        return;
      }

      setPreAssessmentAnswers({
        reason: formattedPayload.reason,
        scopeAnswers: formattedPayload.scopeAnswers,
        gender: formattedPayload.gender,
        dob: formattedPayload.dob,
        scope: statusFromAssessment
      });

      setScopeStatus(statusFromAssessment);
      setAssessmentData(formattedPayload.scopeAnswers);
      setShowAssessment(false);
    } catch (error) {
      console.error('Error in handleSubmitAssessment:', error);
    }
  };

  const handleFollowupAssessment = () => {
    // Allow direct access to follow-up if remarks exist
    if (route.params?.remarks) {
      const formattedDob = `${year_of_birth}-${month_of_birth}-${date_of_birth}`;
      
      const params = {
        gender: gender,
        dob: formattedDob,
        condition: reason,
        appointmentNo: route.params?.appointmentNo,
        scope: route.params.remarks,
        remarks: route.params.remarks,
        phn: phn,
        demographicNo: demographicNo,
        scopeAssessment: {
          reason: reason,
          scopeAnswers: preAssessmentAnswers?.scopeAnswers || {},
          gender: gender,
          scope: route.params.remarks
        },
        onDone: (result) => {
          setFollowupAssessmentDone(true);
          setScopeStatus(result.scopeStatus || route.params.remarks);
          setFollowUpAnswers(result.followUpAnswers);
          setScopeAnswers(result.scopeAnswers);
          setAppointmentNo(result.appointmentNo);
          setScope(result.scope || route.params.remarks);
        }
      };

      navigation.navigate('FollowUpAssessment', params);
      return;
    }

    if (!preAssessmentAnswers) {
      Alert.alert('Error', 'Please complete the pre-assessment first');
      return;
    }

    // Format the date of birth
    const formattedDob = `${year_of_birth}-${month_of_birth}-${date_of_birth}`;

    // Get the scope status
    const currentScope = preAssessmentAnswers.scope || scopeStatus;
    console.log('Current scope status:', currentScope); // Debug log

    // Validate required parameters including scope
    if (!gender || !formattedDob || !reason || !route.params?.appointmentNo || !currentScope) {
      console.error('Missing parameters:', {
        gender,
        dob: formattedDob,
        reason,
        appointmentNo: route.params?.appointmentNo,
        scope: currentScope
      });
      Alert.alert('Error', 'Missing required parameters. Please ensure all information is complete.');
      return;
    }

    const formattedAnswers = Object.entries(preAssessmentAnswers.scopeAnswers).map(([question, answer], index) => ({
      questionId: index + 1,
      question: question,
      answer: Array.isArray(answer) ? answer : String(answer)
    }));

    const params = {
      gender: gender,
      dob: formattedDob,
      condition: preAssessmentAnswers.reason || reason,
      appointmentNo: route.params?.appointmentNo,
      scope: currentScope, // Use the current scope status
      answers: formattedAnswers,
      phn: phn,
      demographicNo: demographicNo,
      scopeAssessment: {
        reason: preAssessmentAnswers.reason || reason,
        scopeAnswers: preAssessmentAnswers.scopeAnswers,
        gender: gender,
        scope: currentScope
      },
      onDone: (result) => {
        setFollowupAssessmentDone(true);
        setScopeStatus(result.scopeStatus);
        setFollowUpAnswers(result.followUpAnswers);
        setScopeAnswers(result.scopeAnswers);
        setAppointmentNo(result.appointmentNo);
        setScope(result.scope);
        
        // Enable next steps based on scope status
        if (!result.scopeStatus?.toLowerCase().includes('refer')) {
          // If not referred, enable prescription
          setPrescriptionDone(false);
        }
      }
    };

    // Log the parameters being passed
    console.log('Navigating to FollowUpAssessment with params:', params);

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

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.followupAssessmentDone) {
        setFollowupAssessmentDone(true);
      }
      if (route.params?.scopeStatus) {
        setScopeStatus(route.params.scopeStatus);
      }
      if (route.params?.soapNotesDone) {
        setSoapNotesDone(true);
      }
    }, [route.params])
  );

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayDate = getTodayDateString();
  const todayEncounterNotes = (encounterNotes || []).filter(
    encounter => encounter.appointment_date === todayDate && encounter.notesData && encounter.notesData.length > 0
  );

  console.log('Chat - Appointment No:', route.params.appointmentNo);

  useEffect(() => {
    return () => {
      dispatch(clearEncounterNotes());
    };
  }, [dispatch]);

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
            previousAnswers={assessmentData}
            appointmentNo={route.params?.appointmentNo}
            subdomain={subdomain}
            demographicNo={route.params?.demographicNo || patientDetails?.demographicNo}
          />
        ) : (
          <>
            <CustomHeader 
              title={patientName ? patientName.replace(/,/g, ' ').trim().toUpperCase() : ""} 
              IconComponent={Call} 
            />
            
            {renderPatientInfo()}
      
            <View style={styles.dateRow}>
              <View style={styles.line} />
              <Text style={styles.dateText}>{formattedDate}</Text>
              <View style={styles.line} />
            </View>

            {/* Main scrollable content */}
            <ScrollView style={styles.mainScrollView}>
              <View>
                {/* Reason Card with Scope Status */}
                <View style={styles.card}>
                  <Text style={styles.messageText}>
                    {reason && `${reason}`}
                    {reasonDesc && `, ${reasonDesc}`}
                  </Text>
                  {/* Scope status */}
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

                {/* Encounter Notes Section */}
                <View style={styles.encounterNotesContainer}>
                  {notesLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#0049F8" />
                      <Text style={styles.loadingText}>Loading encounter notes...</Text>
                    </View>
                  ) : encounterNotes && encounterNotes.length > 0 ? (
                    encounterNotes
                      .filter(encounter => encounter.notesData && encounter.notesData.length > 0)
                      .map((encounter, idx) =>
                        encounter.notesData.map((noteObj, noteIdx) => (
                          <View key={`encounter-${idx}-note-${noteIdx}`} style={styles.encounterNoteCard}>
                            <Text style={styles.noteText}>{noteObj.note}</Text>
                            <Text style={styles.noteTimestamp}>
                              {new Date(encounter.appointment_date).toLocaleDateString()}
                            </Text>
                          </View>
                        ))
                      )
                  ) : (
                    <View style={styles.emptyNotesContainer}>
                      <Text style={styles.emptyNotesText}>No encounter notes available.</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
           
            {/* Footer buttons */}
            <View style={styles.footerRowWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.footerRow}
              >
                <TouchableOpacity 
                  style={[
                    styles.footerButton, 
                    { width: 130, height: 130 },
                    (isPreAssessmentDone || route.params?.remarks) && styles.footerButtonDisabled
                  ]}
                  onPress={handlePreAssessment}
                  disabled={isPreAssessmentDone || route.params?.remarks}
                >
                  {(preAssessmentAnswers || isPreAssessmentDone || route.params?.remarks) && (
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
                    (!preAssessmentAnswers && !route.params?.remarks) && styles.footerButtonDisabled
                  ]}
                  onPress={() => {
                    handleFollowupAssessment();
                  }}
                  disabled={!preAssessmentAnswers && !route.params?.remarks}
                >
                  {(followupAssessmentDone || route.params?.followupAssessmentDone) && (
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
                {scopeStatus && !scopeStatus.toLowerCase().includes('refer') && (
                  <TouchableOpacity 
                    style={[
                      styles.footerButton, 
                      { width: 130, height: 130 },
                      (!followupAssessmentDone && !route.params?.followupAssessmentDone) && styles.footerButtonDisabled
                    ]}
                    onPress={() => {
                      if (!followupAssessmentDone && !route.params?.followupAssessmentDone) {
                        Alert.alert('Error', 'Please complete the follow-up assessment first');
                        return;
                      }
                      navigation.navigate('DrugPrescription', {
                        demographicNo: demographicNo,
                        condition: preAssessmentAnswers?.reason || reason,
                        gender: gender,
                        dob: `${year_of_birth}-${month_of_birth}-${date_of_birth}`,
                        phn: phn,
                        appointmentNo: route.params.appointmentNo,
                        onDone: () => setPrescriptionDone(true),
                      });
                    }}
                    disabled={!followupAssessmentDone && !route.params?.followupAssessmentDone}
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
                )}
                <TouchableOpacity 
                  style={[
                    styles.footerButton, 
                    { width: 130, height: 130 },
                    (scopeStatus && scopeStatus.toLowerCase().includes('refer')
                      ? (!followupAssessmentDone && !route.params?.followupAssessmentDone)
                      : (!followupAssessmentDone || !prescriptionDone)
                    ) && styles.footerButtonDisabled
                  ]}
                  onPress={() => {
                    if (
                      (scopeStatus && scopeStatus.toLowerCase().includes('refer')
                        ? (!followupAssessmentDone && !route.params?.followupAssessmentDone)
                        : (!followupAssessmentDone || !prescriptionDone)
                      )
                    ) {
                      Alert.alert('Error', 'Please complete the previous steps first');
                      return;
                    }
                    navigation.navigate('SoapNotes', {
                      demographicNo,
                      appointmentNo,
                      gender,
                      dob: `${year_of_birth}-${month_of_birth}-${date_of_birth}`,
                      allergies: route.params?.allergies ,
                      phn: phn,
                      followUpAnswers,
                      scopeAnswers,
                      scope,
                      reason: preAssessmentAnswers?.reason || reason,
                      medications: route.params?.medications || [],
                      firstName: route.params?.firstName,
                      lastName: route.params?.lastName,
                      clinicContact: route.params?.clinicContact,
                      reasonDesc: route.params?.reasonDesc ,
                      onDone: () => setSoapNotesDone(true),
                    });
                  }}
                  disabled={
                    scopeStatus && scopeStatus.toLowerCase().includes('refer')
                      ? (!followupAssessmentDone && !route.params?.followupAssessmentDone)
                      : (!followupAssessmentDone || !prescriptionDone)
                  }
                >
                  {soapNotesDone && (
                    <View style={styles.checkmarkContainer}>
                      <TickIcon />
                    </View>
                  )}
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.footerButtonText}>
                      Generate{'\n'}SOAP Notes
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Button to open PDF */}
            {pdfPath && (
              <TouchableOpacity
                style={{
                  margin: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#0049F8',
                  borderRadius: 8,
                  backgroundColor: '#f0f4ff',
                }}
                onPress={() => setShowPdf(true)}
              >
                <Text style={{ color: '#0049F8', fontWeight: 'bold' }}>View SOAP PDF Document</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </SafeAreaView>

      {/* Modal to show PDF */}
      <Modal visible={showPdf} onRequestClose={() => setShowPdf(false)}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => setShowPdf(false)} style={{ padding: 12 }}>
            <Text style={{ color: '#0049F8', fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
          <Pdf
            source={{ uri: `file://${pdfPath}` }}
            style={{ flex: 1, margin: 10 }}
            onError={error => {
              Alert.alert('PDF Error', error.message);
            }}
          />
        </View>
      </Modal>
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
  mainScrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  card: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbb',
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  messageText: {
    fontSize: 16,
    color: '#222',
    textAlign: 'left',
    lineHeight: 24,
    fontWeight: '300',
  },
  encounterNotesContainer: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 10,
  },
  encounterNoteCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbb',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',

  },
  noteText: {
    color: '#333',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
    fontWeight: '300',
  },
  noteTimestamp: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  loadingText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '300',
  },
  emptyNotesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyNotesText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
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

