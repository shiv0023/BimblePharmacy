import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import CustomHeader from './CustomHeader';
import { useDispatch, useSelector } from 'react-redux';
import { getScopeStatus } from '../Redux/Slices/GenerateAssessmentslice';

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

const AcneScopeAssessment = ({ questions, onSubmit, onCancel, gender, reason, ageString, year_of_birth, month_of_birth, date_of_birth, dob }) => {
  const dispatch = useDispatch();
  const scopeStatusLoading = useSelector(
    state => state.generateAssessment?.scopeStatusLoading || false
  );

  const [assessmentDataState, setAssessmentDataState] = useState({});
  const [localLoading, setLocalLoading] = useState(false);

  const appointment = useSelector(state => state.appointment?.selectedAppointment);

  const computedAgeString = ageString || getAgeString(year_of_birth, month_of_birth, date_of_birth);

  useEffect(() => {
    const initialState = {};
    questions.forEach((q, idx) => {
      if (q.type === 'checkbox') {
        initialState[`question_${idx}`] = [];
      } else if (q.question.toLowerCase().includes('how old are you')) {
        initialState[`question_${idx}`] = ageString || getAgeString(year_of_birth, month_of_birth, date_of_birth) || '';
      } else {
        initialState[`question_${idx}`] = '';
      }
    });
    setAssessmentDataState(initialState);
  }, [questions, ageString, year_of_birth, month_of_birth, date_of_birth]);

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
    // Build scopeAnswers with correct types
    const scopeAnswers = {};
    questions.forEach((q, idx) => {
      let answer = assessmentDataState[`question_${idx}`];
      if (q.type === 'checkbox' && !Array.isArray(answer)) answer = [];
      if ((q.type === 'text' || q.type === 'button') && typeof answer !== 'string') answer = '';
      scopeAnswers[q.question] = answer;
    });

    // Format DOB if not provided directly
    const formattedDob = dob || `${year_of_birth}-${month_of_birth}-${date_of_birth}`;

    setLocalLoading(true);

    const payload = {
      reason: reason || '',
      gender: gender || '',
      scopeAnswers: scopeAnswers,
      dob: formattedDob,
    };

    console.log('Payload with DOB:', payload);

    try {
      const result = await dispatch(getScopeStatus(payload)).unwrap();
      onSubmit && onSubmit({
        result,
        formattedPayload: {
          reason: reason || '',
          scopeAnswers: scopeAnswers,
          gender: gender || '',
          dob: formattedDob
        },
        scopeStatus: result?.scopeStatus
      });
      alert('Assessment submitted successfully');
    } catch (error) {
      console.error('Failed to get scope status:', error);
      alert('Error: ' + (error.message || 'Failed to submit assessment'));
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

  return (
    <View style={styles.container}>
      <CustomHeader title=" Scope Assessment" />
      <ScrollView style={styles.scrollView}>
        {/* <Text style={styles.assessmentTitle}>Acne Scope Assessment</Text> */}
        
        {questions.map((question, index) => renderQuestion(question, index))}

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
    marginLeft:6
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
    marginTop: 10,
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