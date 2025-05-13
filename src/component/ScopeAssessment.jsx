import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import CustomHeader from './CustomHeader';
import { useDispatch, useSelector } from 'react-redux';
import { getScopeStatus } from '../Redux/Slices/GenerateAssessmentslice';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import ScopeAssessmentPdf from '../component/ScopeAssessmentpdf.'; // fix the import path if needed
import { fetchClinicDetails } from '../Redux/Slices/ClinicDetails'; // adjust path as needed
import { getStaticScopeAssessmentHtml } from './ScopeAssessmentpdf..jsx';
import { fetchPatientDetails } from '../Redux/Slices/PatientDetailsSlice';

function calculateFullAge(year, month, day) {
  if (!year || !month || !day) return null;
  const today = new Date();
  const birthDate = new Date(year, month - 1, day); // month is 0-indexed
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

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

const AcneScopeAssessment = ({
  questions,
  onSubmit,
  onCancel,
  gender,
  reason,
  ageString,
  year_of_birth,
  month_of_birth,
  date_of_birth,
  dob,
  previousAnswers,
  demographicNo,
  appointmentNo
}) => {
  const dispatch = useDispatch();
  const scopeStatusLoading = useSelector(
    state => state.generateAssessment?.scopeStatusLoading || false
  );

  const clinic = useSelector(state => state.auth?.clinicDetails?.data);
  console.log(clinic,'hii')
  const patientDetails = useSelector(state => state.auth?.patientDetails?.dataaaa || {});

  const [assessmentDataState, setAssessmentDataState] = useState({});
  const [localLoading, setLocalLoading] = useState(false);

  const appointment = useSelector(state => state.appointment?.selectedAppointment);

  const computedAgeString = ageString || getAgeString(year_of_birth, month_of_birth, date_of_birth);

  useEffect(() => {
    if (!clinic) {
      dispatch(fetchClinicDetails());
    }
  }, [clinic, dispatch]);

  useEffect(() => {
    const initialState = {};
    questions.forEach((q, idx) => {
      if (previousAnswers && previousAnswers[q.question] !== undefined) {
        initialState[`question_${idx}`] = previousAnswers[q.question];
      } else if (q.type === 'checkbox') {
        initialState[`question_${idx}`] = [];
      } else if (q.question.toLowerCase().includes('how old are you')) {
        initialState[`question_${idx}`] = ageString || getAgeString(year_of_birth, month_of_birth, date_of_birth) || '';
      } else {
        initialState[`question_${idx}`] = '';
      }
    });
    setAssessmentDataState(initialState);
  }, [questions, ageString, year_of_birth, month_of_birth, date_of_birth, previousAnswers]);

  useEffect(() => {
    if (demographicNo) {
      dispatch(fetchPatientDetails({ demographicNo }));
    }
  }, [demographicNo, dispatch]);

  const renderQuestion = (question, index) => {
    switch (question.type) {
      case 'text':
        return (
          <View style={styles.questionContainer} key={index}>
            <Text style={styles.questionText}>{question.question}</Text>
            <TextInput 
              style={styles.input}
              value={assessmentDataState[`question_${index}`] || ''}
              onChangeText={(text) => setAssessmentDataState({...assessmentDataState, [`question_${index}`]: text})}
              keyboardType="numeric"
              placeholder="Enter your answer"
            />
          </View>
        );

      case 'button':
        return (
          <View style={styles.questionContainer} key={index}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.note && (
              <Text style={styles.noteText}>{question.note}</Text>
            )}
            <View style={styles.buttonGroup}>
              {question.options.map((option, optionIndex) => (
                <TouchableOpacity 
                  key={optionIndex}
                  style={[
                    styles.button,
                    assessmentDataState[`question_${index}`] === option && styles.buttonSelected
                  ]}
                  onPress={() => setAssessmentDataState({
                    ...assessmentDataState,
                    [`question_${index}`]: option
                  })}
                >
                  <Text style={[
                    styles.buttonText,
                    assessmentDataState[`question_${index}`] === option && styles.buttonTextSelected
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'checkbox':
        return (
          <View style={styles.questionContainer} key={index}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.note && (
              <Text style={styles.noteText}>{question.note}</Text>
            )}
            <View style={styles.checkboxGroup}>
              {question.options.map((option, optionIndex) => {
                const isSelected = assessmentDataState[`question_${index}`]?.includes(option);
                return (
                  <TouchableOpacity 
                    key={optionIndex}
                    style={styles.checkboxRow}
                    onPress={() => {
                      const currentSelections = assessmentDataState[`question_${index}`] || [];
                      const newSelections = isSelected
                        ? currentSelections.filter(item => item !== option)
                        : [...currentSelections, option];
                      setAssessmentDataState({
                        ...assessmentDataState,
                        [`question_${index}`]: newSelections
                      });
                    }}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.checkboxText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const handleCheckScope = async () => {
    // Only require answers for visible questions
    const visibleQuestions = questions.filter((question, index) => {
      if (question.dependsOn) {
        const depIndex = questions.findIndex(q =>
          (q.key && q.key === question.dependsOn.key) ||
          (q.question && q.question === question.dependsOn.key)
        );
        if (depIndex === -1) return false;
        const depAnswer = assessmentDataState[`question_${depIndex}`];
        if (depAnswer !== question.dependsOn.value) return false;
      }
      // Optionally, keep your previous logic for the last question
      if (index === questions.length - 1 && !showLastQuestion) {
        return false;
      }
      return true;
    });

    const missing = visibleQuestions.filter((q, idx) => {
      const answer = assessmentDataState[`question_${questions.indexOf(q)}`];
      return typeof answer === 'undefined' || answer === null || answer === '';
    });

    if (missing.length > 0) {
      Alert.alert('Please answer all questions before submitting.');
      return;
    }

    setLocalLoading(true);

    // Build scopeAnswers: include ALL questions, but for hidden ones, send empty string
    const scopeAnswers = {};
    questions.forEach((q, idx) => {
      let isVisible = true;
      if (q.dependsOn) {
        const depIndex = questions.findIndex(qq =>
          (qq.key && qq.key === q.dependsOn.key) ||
          (qq.question && qq.question === q.dependsOn.key)
        );
        if (depIndex === -1) isVisible = false;
        const depAnswer = assessmentDataState[`question_${depIndex}`];
        if (depAnswer !== q.dependsOn.value) isVisible = false;
      }
      // Optionally, keep your previous logic for the last question
      if (idx === questions.length - 1 && !showLastQuestion) {
        isVisible = false;
      }
      // If visible, use the answer; if not, send empty string
      let answer = isVisible ? assessmentDataState[`question_${idx}`] : '';
      if (typeof answer === 'undefined' || answer === null) answer = '';
      scopeAnswers[q.question] = answer;
    });

    // Format DOB if not provided directly
    const formattedDob = dob || `${year_of_birth}-${month_of_birth}-${date_of_birth}`;

    const payload = {
      reason: reason || '',
      gender: gender || '',
      scopeAnswers: scopeAnswers,
      dob: formattedDob,
      appointmentNo: appointmentNo,
    };

    console.log('Payload with DOB:', payload);

    try {
      const result = await dispatch(getScopeStatus(payload)).unwrap();
      
      // Use the clinic and patientDetails from the component level
      const patient = {
        name: `${patientDetails?.firstName || ''} ${patientDetails?.lastName || ''}${patientDetails?.gender ? '/' + (patientDetails.gender === 'M' ? 'Male' : 'Female') : ''}`,
        dob: patientDetails?.dob || '',
        phn: patientDetails?.phn || '',
        address: [
          patientDetails?.address,
          patientDetails?.city,
          patientDetails?.province,
          patientDetails?.postalCode
        ].filter(Boolean).join(', '),
        reason: reason || ''
      };

      const questionsArr = questions.map(q => q.question);
      const answersArr = questions.map((q, idx) => scopeAnswers[q.question] || '');

      // Generate PDF
      const htmlContent = getStaticScopeAssessmentHtml({
        clinic,
        patient,
        questions: questionsArr,
        answers: answersArr,
        assessmentResult: result?.assessmentResult || '',
        scopeStatus: result?.scopeStatus || '',
      });

      // Create PDF file
      const options = {
        html: htmlContent,
        fileName: `Scope_Assessment_${patientDetails?.firstName || ''} ${patientDetails?.lastName || ''} ${new Date().toISOString().split("T")[0]}`,
        directory: Platform.OS === 'android' ? 'Download' : 'Documents',
        base64: false
      };

      try {
        const file = await RNHTMLtoPDF.convert(options);
        
        // Open the PDF
        await FileViewer.open(file.filePath, {
          showOpenWithDialog: true,
          onDismiss: () => {
            console.log('PDF viewer dismissed');
          }
        });
      } catch (error) {
        console.error('PDF generation error:', error);
        Alert.alert('Error', 'Failed to generate PDF');
      }

      onSubmit && onSubmit({
        result,
        formattedPayload: {
          reason: reason || '',
          scopeAnswers: scopeAnswers,
          gender: gender || '',
          dob: formattedDob,
          appointmentNo: ''
        },
        scopeStatus: result?.scopeStatus
      });

    } catch (error) {
      console.error('Failed to get scope status:', error);
      Alert.alert('Error', 'Failed to process assessment');
    } finally {
      setLocalLoading(false);
    }
  };

  const fullAge = appointment?.age !== undefined && appointment?.age !== null
    ? appointment.age
    : calculateFullAge(
        appointment?.year_of_birth,
        appointment?.month_of_birth,
        appointment?.date_of_birth
      );

  const secondLastIndex = questions.length - 2;
  const showLastQuestion = assessmentDataState[`question_${secondLastIndex}`] === 'Yes';

  const generateAndOpenPdf = async () => {
    try {
      const fileName = `Scope_Assessment_${firstName}_${lastName}_${new Date().toISOString().split("T")[0]}.pdf`;
      const options = {
        html: htmlContent,
        fileName: fileName.replace('.pdf', ''),
        directory: Platform.OS === 'android' ? 'Download' : 'Documents',
      };
      const file = await RNHTMLtoPDF.convert(options);
      await FileViewer.open(file.filePath, { showOpenWithDialog: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to open PDF: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title=" Scope Assessment" />
      <ScrollView style={styles.scrollView}>
        {/* <Text style={styles.assessmentTitle}>Acne Scope Assessment</Text> */}
        
        {questions.map((question, index) => {
          // Handle conditional rendering based on dependsOn
          if (question.dependsOn) {
            // Find the index of the dependency question
            const depIndex = questions.findIndex(q =>
              (q.key && q.key === question.dependsOn.key) ||
              (q.question && q.question === question.dependsOn.key)
            );
            if (depIndex === -1) return null;
            const depAnswer = assessmentDataState[`question_${depIndex}`];
            if (depAnswer !== question.dependsOn.value) return null;
          }
          // Optionally, keep your previous logic for the last question
          if (index === questions.length - 1 && !showLastQuestion) {
            return null;
          }
          return renderQuestion(question, index);
        })}

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleCheckScope}
          disabled={scopeStatusLoading || localLoading}
        >
          {(scopeStatusLoading || localLoading) ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Check Scope</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  assessmentTitle: {
    fontSize: 24,
    fontWeight: '400',
    paddingTop: 2,
    marginBottom: 20,
 
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '200',
    marginLeft:2
  },
  noteText: {
    fontWeight: '200',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    
  },
  button: {
    flex: 1,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  buttonSelected: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  buttonText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '200',
  },
  buttonTextSelected: {
    color: '#fff',
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
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    borderColor: '#0049F8',
    backgroundColor: '#0049F8',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,

 
  },
  checkboxText: {
    fontSize: 16,
    color: '#222',
    flex: 1,
    fontWeight:'200',

    
  
   
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#222',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default AcneScopeAssessment;