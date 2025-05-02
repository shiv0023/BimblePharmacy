import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {loginUser, authenticateUser} from '../Redux/Slices/AuthSlice';
import {fetchSubdomains} from '../Redux/Slices/ClinicSlice';
import {
  Cliniccon,
  CloseEyeIcon,
  ConfirmPasswordIcon,
  EyeIcon,
  LoginIconLock,
  LoginPageImage,
  PasswordLockIcon,
  UserIcon,
} from './svgComponent';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

export default function Login({navigation}) {
  const [subdomainBimble, setSubdomain] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [clinicDisplayName, setClinicDisplayName] = useState('');

  //
  const dispatch = useDispatch();
  const authResponse = useSelector(state => state?.user);
  const error = authResponse?.error || null;

  const clinicState = useSelector(state => {
    const clinicData = state?.auth?.clinic;

    return clinicData || {};
  });
  const {subdomains = [], loading = false} = clinicState;

  // Log whenever subdomains changes
  useEffect(() => {
   
  }, [subdomains]);

  // Test API call directly
  const testApiCall = async () => {
    setIsLoading(true);
    try {
    
      const response = await dispatch(fetchSubdomains()).unwrap();
    
    } catch (error) {
      console.error('API Call Failed:', error);
      
      // More detailed error logging
      if (error.message) {
        console.error('Error message:', error.message);
      }
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('Request made but no response received');
        console.error('Request details:', error.request);
      } else {
        console.error('Error setting up request:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testApiCall();
  }, []);

  useEffect(() => {

  }, [subdomains, loading]);
  useEffect(() => {
    const checkAuthToken = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        dispatch(authenticateUser({token}));
        navigation.navigate('Appointment');
      }
    };

    checkAuthToken();
  }, [dispatch, navigation]);

  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        const savedCredentials = await AsyncStorage.getItem('userCredentials');
        if (savedCredentials) {
          const {subdomain, username, password, pin, clinicDisplayName} =
            JSON.parse(savedCredentials);
          console.log('Remember Me - Saved User Data:', {
            subdomain,
            username,
            pin,
            hasPassword: !!password,
          });

          setSubdomain(subdomain);
          setUsername(username);
          setPassword(password);
          setPin(pin);
          setRememberMe(true);
          setClinicDisplayName(clinicDisplayName);
        }
      } catch (error) {
        console.error('Error loading remembered data:', error);
      }
    };

    checkSavedCredentials();
  }, []);

  const [errors, setErrors] = useState({
    subdomain: false,
    username: false,
    password: false,
    pin: false,
    terms: {isError: false, message: ''},
  });

  const validateInputs = () => {
    let isValid = true;
    const newErrors = {
      subdomain: false,
      username: false,
      password: false,
      pin: false,
      terms: {isError: false, message: ''},
    };

    if (!subdomainBimble) {
      newErrors.subdomain = true;
      isValid = false;
    } else if (!username) {
      newErrors.username = true;
      isValid = false;
    } else if (!password) {
      newErrors.password = true;
      isValid = false;
    } else if (!pin) {
      newErrors.pin = true;
      isValid = false;
    } else if (!acceptedTerms) {
      newErrors.terms = {
        isError: true,
        message: 'Please accept terms and conditions',
      };
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (validateInputs()) {
      setIsLoading(true);
      try {
        const requestedData = {
          subdomainBimble,
          username,
          password,
          pin,
        };

        const response = await dispatch(loginUser({requestedData})).unwrap();

        await AsyncStorage.setItem('auth_token', response.access_token);

        if (rememberMe) {
          await AsyncStorage.setItem(
            'userCredentials',
            JSON.stringify({
              subdomain: subdomainBimble,
              username,
              password,
              pin,
              clinicDisplayName: clinicDisplayName,
            }),
          );
        } else {
          await AsyncStorage.removeItem('userCredentials');
        }

        navigation.navigate('Appointment');
      } catch (error) {
        console.error('Login  error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    switch (field) {
      case 'subdomain':
        setSubdomain(value);
        break;
      case 'username':
        setUsername(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'pin':
        setPin(value);
        break;
    }
  };

  const renderSubdomainInput = () => (
    <View style={[styles.inputWrapper, errors.subdomain && styles.inputError]}>
      <Cliniccon style={styles.icon} />
      <View style={styles.inputWithSuggestions}>
        <TextInput
          style={styles.input}
          placeholder="Clinic Name"
          value={clinicDisplayName || subdomainBimble}
          onChangeText={(text) => {
     
            setSubdomain(text);
            setClinicDisplayName('');
            setErrors((prev) => ({ ...prev, subdomain: false }));

            if (text.length > 0) {
              setShowSuggestions(true);
            } else {
              setShowSuggestions(false);
            }
          }}
          onFocus={() => {
          
            if (subdomainBimble.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholderTextColor={'black'}
        />
        {showSuggestions && subdomainBimble.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2968FF" />
              </View>
            ) : (
              <>
                {subdomains?.data && subdomains.data.length > 0 ? (
                  subdomains.data
                    .filter((clinic) => {
                      // Ensure the subdomainBimble is defined and perform a case-insensitive match
                      return clinic.subdomainBimble
                        ?.toLowerCase()
                        .startsWith(subdomainBimble.toLowerCase());
                    })
                    .map((clinic, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setSubdomain(clinic.subdomainBimble);
                          setClinicDisplayName(clinic.entityName);
                          setShowSuggestions(false);
                        }}
                      >
                        <Text style={styles.suggestionText}>
                          {clinic.entityName}
                        </Text>
                      </TouchableOpacity>
                    ))
                ) : (
                  <View style={styles.noSuggestionsContainer}>
                    <Text style={styles.noSuggestionsText}>
                      No matching clinics found
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
  

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar translucent backgroundColor="#fff" barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerImageWrapper}>
            <LoginPageImage style={styles.image} />
            <View style={styles.lockIconWrapper}>
              <LoginIconLock style={styles.lockIcon} />
            </View>
          </View>
        </View>

        <Text variant="heading">Welcome Back!</Text>
        <Text style={styles.subText}>Login to continue</Text>

        <View style={styles.inputContainer}>
          {renderSubdomainInput()}

          <View
            style={[styles.inputWrapper, errors.username && styles.inputError]}>
            <UserIcon style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={text => {
                handleInputChange('username', text);
                setErrors(prev => ({...prev, username: false}));
              }}
              placeholderTextColor={'black'}
              autoFocus={false}
            />
          </View>

          <View
            style={[styles.inputWrapper, errors.password && styles.inputError]}>
            <PasswordLockIcon style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={text => {
                handleInputChange('password', text);
                setErrors(prev => ({...prev, password: false}));
              }}
              placeholderTextColor={'black'}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.passwordToggle}>
              {passwordVisible ? <EyeIcon /> : <CloseEyeIcon />}
            </TouchableOpacity>
          </View>

          <View style={[styles.inputWrapper, errors.pin && styles.inputError]}>
            <ConfirmPasswordIcon style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="PIN"
              secureTextEntry={!pinVisible}
              keyboardType="numeric"
              maxLength={6}
              value={pin}
              onChangeText={text => {
                handleInputChange('pin', text);
                setErrors(prev => ({...prev, pin: false}));
              }}
              placeholderTextColor={'black'}
            />
            <TouchableOpacity
              onPress={() => setPinVisible(!pinVisible)}
              style={styles.passwordToggle}>
              {pinVisible ? <EyeIcon /> : <CloseEyeIcon />}
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                rememberMe ? styles.checkboxChecked : styles.checkboxUnchecked,
              ]}
              onPress={() => setRememberMe(!rememberMe)}>
              {rememberMe && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </TouchableOpacity>
            <Text variant="accent">
              Remember for 30 days
            </Text>
          </View>

          <View>
            <View
              style={[
                styles.checkboxContainer,
                errors.terms.isError && styles.checkboxError,
              ]}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  acceptedTerms
                    ? styles.checkboxChecked
                    : styles.checkboxUnchecked,
                ]}
                onPress={() => {
                  const newTermsState = !acceptedTerms;
                  setAcceptedTerms(newTermsState);
                  if (newTermsState) {
                    setErrors(prev => ({
                      ...prev,
                      terms: {isError: false, message: ''},
                    }));
                  } else {
                    setErrors(prev => ({
                      ...prev,
                      terms: {
                        isError: true,
                        message: 'Please accept terms and conditions',
                      },
                    }));
                  }
                }}>
                {acceptedTerms && (
                  <Text style={styles.checkboxCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
              <View style={styles.termsTextContainer}>
                <Text variant="accent">I agree to the </Text>
                <TouchableOpacity
                  onPress={() => {
                    /* Navigate to Terms */
                  }}>
                  <Text style={styles.termsLink}>Terms & Conditions</Text>
                </TouchableOpacity>
                <Text variant="accent"> and </Text>
                <TouchableOpacity
                  onPress={() => {
                    /* Navigate to Privacy Policy */
                  }}>
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.terms.isError && (
              <Text style={[styles.errorMessage, styles.termsErrorMessage]}>
                {errors.terms.message}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity>
          <Text variant="accent" style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerImageWrapper: {
    position: 'relative',
    marginTop: 25,
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  lockIconWrapper: {
    position: 'absolute',
    bottom: 105,
    right: 155,
  },
  lockIcon: {
    fontSize: 24,
    color: '#004AAD',
  },
 
  subText: {
    marginBottom: 30,
    marginTop:4
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: wp('2.5%'),
    backgroundColor: '#F1F3F7',
    marginBottom: hp('2%'),
    height: hp('6%'),
    paddingHorizontal: wp('4%'),
  },
  input: {
    flex: 1,
    fontSize: wp('4%'),
    color: '#151515',
    height: '100%',
    paddingVertical: 0,
  },
  icon: {
    fontSize: wp('5%'),
    marginRight: wp('2.5%'),
  },
  passwordToggle: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: wp('2.5%'),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderWidth: 1,
    borderRadius: 4,
    marginRight: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxUnchecked: {
    borderColor: '#666',
  },
  checkboxChecked: {
    borderColor: '#004AAD',
    backgroundColor: '#0049F8',
  },
  checkboxCheckmark: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  loginButton: {
    backgroundColor: '#2968FF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 400,
    fontFamily: 'Product Sans Regular',
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#797979',
    marginBottom: 20,
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsLink: {
    color: '#2968FF',
    fontSize: wp('3.5%'),
    textDecorationLine: 'underline',
    fontWeight: '400',
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('2%'),
    paddingVertical: 5,
  },
  checkboxError: {
    borderColor: 'red',
    borderWidth: 1,
    borderRadius: 5,
    padding: wp('2%'),
  },
  label: {
    marginLeft: 8,
  },
  errorMessage: {
    color: 'red',
    fontSize: wp('3%'),
    marginTop: hp('1%'),
    marginLeft: wp('7%'),
  },
  inputWithSuggestions: {
    flex: 1,
    position: 'relative',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  suggestionText: {
    fontSize: 16,
    color: '#151515',
    fontFamily: 'Product Sans Regular',
  },
  loadingContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noSuggestionsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noSuggestionsText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Product Sans Regular',
  },
});
