import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Alert,
  StyleSheet,
  SafeAreaView,
  Pressable,
  StatusBar
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { generateFollowupAssessment } from '../Redux/Slices/FollowUpAssessmentSlice';
import { getMedicationList } from '../Redux/Slices/MedicationlistSlice';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomHeader from './CustomHeader';

const FollowUpAssessment = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  
  const { 
    gender, 
    dob, 
    condition, 
    appointmentNo, 
    scope,
    answers: initialAnswers = []
  } = route.params || {};

  const followupAssessment = useSelector(state => state.auth.followupAssessment || {});
  console.log('Component State:', followupAssessment);
  const questions = followupAssessment.data || [];
  const loading = followupAssessment.loading || false;
  const error = followupAssessment.error;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!gender || !dob || !condition || !appointmentNo || !scope) {
        Alert.alert('Error', 'Missing required parameters');
        navigation.goBack();
        return;
      }

      try {
        setIsDataLoading(true);
        const result = await dispatch(generateFollowupAssessment({
          gender,
          dob,
          condition,
          appointmentNo,
          scope,
          scopeAnswers: route.params?.scopeAssessment?.scopeAnswers
        })).unwrap();

        console.log('Follow-up questions result:', result);
      } catch (error) {
        console.error('Error fetching follow-up questions:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to load follow-up questions'
        );
        navigation.goBack();
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchQuestions();
  }, [dispatch, navigation, route.params]);

  const handleAnswerSelect = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const answersArray = Object.entries(answers).map(([index, answer]) => ({
        questionId: parseInt(index) + 1,
        answer: answer
      }));

      const currentScope = scope || route.params?.scope;

      if (
        currentScope &&
        /(out of scope|refer)/i.test(currentScope)
      ) {
        navigation.navigate('SoapNotes', {
          gender,
          dob,
          condition,
          scope: currentScope,
          scopeAnswers: route.params?.scopeAssessment?.scopeAnswers,
          followUpAnswers: answersArray,
          medications: "",
          appointmentNo: appointmentNo,
        });
      } else {
        navigation.navigate('DrugPrescription', {
          demographicNo: appointmentNo,
          reason: condition,
          gender: gender,
          dob: dob,
          phn: route.params?.phn,
          
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit assessment');
    }
  };

  if (isDataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Follow-up Assessment" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0049F8" />
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

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
    <SafeAreaView style={{ flex: 1, }}>
    
      <CustomHeader title="Follow-up Assessment" />
      <ScrollView style={styles.scrollView}>
        {/* <Text style={styles.title}>Follow-up Assessment</Text>
         */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {typeof error === 'string' ? error : error?.message || 'An error occurred'}
            </Text>
          </View>
        )}
        
        {questions.length > 0 && currentQuestion && (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              {`${currentQuestionIndex + 1}. ${currentQuestion.question}`}
            </Text>
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.optionButton,
                    answers[currentQuestionIndex] === option && styles.selectedOption
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                >
                  <Text style={[
                    styles.optionText,
                    answers[currentQuestionIndex] === option && styles.selectedOptionText
                  ]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {questions.length === 0 && !loading && !error && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>No questions available</Text>
          </View>
        )}

        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          {currentQuestionIndex === questions.length - 1 ? (
            <TouchableOpacity 
              style={[styles.navButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={!answers[currentQuestionIndex]}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.navButton, !answers[currentQuestionIndex] && styles.disabledButton]}
              onPress={handleNext}
              disabled={!answers[currentQuestionIndex]}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  questionContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  questionText: {
    fontSize: 14,
    color: '#222',
    fontWeight:400
  },
  optionsContainer: {
    marginTop: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  optionText: {
    fontSize: 14,
    color: '#222',
    fontWeight:'300'
  },
  selectedOptionText: {
    color: '#fff',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
   
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#0049F8',
    minWidth: 120,
    alignItems: 'center',
  
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FollowUpAssessment;