import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, authenticateUser } from '../Redux/Slices/AuthSlice';
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

export default function Login({ navigation }) {
  // Method 1: Log entire styles object
  // console.log('All styles:', JSON.stringify(styles, null, 2));

  // // Method 2: Log specific style properties
  // console.log('Container styles:', styles.welcomeText);


  // Method 3: Log with custom formatting
  // Object.entries(styles).forEach(([key, value]) => {
  //   console.log(`Style - ${key}:`, value);
  // });

  // Local state for inputs
  const [subdomainBimble, setSubdomain] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redux hooks
  const dispatch = useDispatch();
  const authResponse = useSelector((state) => state?.user);
  const error = authResponse?.error || null;

  // Check for auth token on app start
  useEffect(() => {
    const checkAuthToken = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        dispatch(authenticateUser({ token }));
        navigation.navigate('Appointment');
      }
    };

    checkAuthToken();
  }, [dispatch, navigation]);

  // Check for saved credentials when component mounts
  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        const savedCredentials = await AsyncStorage.getItem('userCredentials');
        if (savedCredentials) {
          const { subdomain, username, password, pin } = JSON.parse(savedCredentials);
          console.log('Remember Me - Saved User Data:', {
            subdomain,
            username,
            pin,
            hasPassword: !!password
          });
          
          // Auto-fill the fields
          setSubdomain(subdomain);
          setUsername(username);
          setPassword(password);
          setPin(pin);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading remembered data:', error);
      }
    };

    checkSavedCredentials();
  }, []);

  // Add new state for tracking validation errors
  const [errors, setErrors] = useState({
    subdomain: false,
    username: false,
    password: false,
    pin: false,
    terms: false
  });

  // Replace all validate functions with this single function
  const validateInputs = () => {
    const newErrors = {
      subdomain: !subdomainBimble,
      username: !username,
      password: !password,
      pin: !pin,
      terms: !acceptedTerms
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Handle login action
  const handleLogin = async () => {
    if (validateInputs()) {
      setIsLoading(true); // Start loading
      try {
        const requestedData = {
          subdomainBimble,
          username,
          password,
          pin,
        };

        const response = await dispatch(loginUser({ requestedData }))
          .unwrap();

        // Save both token and credentials if remember me is checked
        if (rememberMe) {
          await AsyncStorage.setItem('auth_token', response.access_token);
          await AsyncStorage.setItem('userCredentials', JSON.stringify({
            subdomain: subdomainBimble,
            username,
            password,
            pin
          }));
        } else {
          // Clear saved credentials if remember me is unchecked
          await AsyncStorage.removeItem('userCredentials');
        }
        
        navigation.navigate('Appointment');
      } catch (error) {
        console.error('Login error:', error);
      } finally {
        setIsLoading(false); // Stop loading whether success or failure
      }
    }
  };

  // Add logout function (to be used in other components)
 

  const handleInputChange = (field, value) => {
    switch(field) {
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

        <Text style={styles.welcomeText}>Welcome Back!</Text>
        <Text style={styles.subText}>Login to continue</Text>

        <View style={styles.inputContainer}>
          <View style={[
            styles.inputWrapper,
            errors.subdomain && styles.inputError
          ]}>
            <Cliniccon style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Subdomain ID"
              value={subdomainBimble}
              onChangeText={(text) => {
                handleInputChange('subdomain', text);
                setErrors(prev => ({...prev, subdomain: false}));
              }}
              placeholderTextColor={'black'}
              autoFocus={true}
            />
          </View>

          <View style={[
            styles.inputWrapper,
            errors.username && styles.inputError
          ]}>
            <UserIcon style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={(text) => {
                handleInputChange('username', text);
                setErrors(prev => ({...prev, username: false}));
              }}
              placeholderTextColor={'black'}
              autoFocus={false}
            />
          </View>

          <View style={[
            styles.inputWrapper,
            errors.password && styles.inputError
          ]}>
            <PasswordLockIcon style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={(text) => {
                handleInputChange('password', text);
                setErrors(prev => ({...prev, password: false}));
              }}
              placeholderTextColor={'black'}

            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.passwordToggle}
            >
              {passwordVisible ? <EyeIcon /> : <CloseEyeIcon />}
            </TouchableOpacity>
          </View>

          <View style={[
            styles.inputWrapper,
            errors.pin && styles.inputError
          ]}>
            <ConfirmPasswordIcon style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="PIN"
              secureTextEntry={!pinVisible}
              keyboardType="numeric"
              maxLength={6}
              value={pin}
              onChangeText={(text) => {
                handleInputChange('pin', text);
                setErrors(prev => ({...prev, pin: false}));
              }}
              placeholderTextColor={'black'}

            />
            <TouchableOpacity
              onPress={() => setPinVisible(!pinVisible)}
              style={styles.passwordToggle}
            >
              {pinVisible ? <EyeIcon /> : <CloseEyeIcon />}
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                rememberMe ? styles.checkboxChecked : styles.checkboxUnchecked,
              ]}
              onPress={() => setRememberMe(!rememberMe)}
            >
              {rememberMe && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.checkboxText}>Remember for 30 days</Text>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                acceptedTerms ? styles.checkboxChecked : styles.checkboxUnchecked,
              ]}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              {acceptedTerms && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </TouchableOpacity>
            <View style={styles.termsTextContainer}>
              <Text style={styles.checkboxText}>I agree to the </Text>
              <TouchableOpacity onPress={() => {/* Navigate to Terms */}}>
                <Text style={styles.termsLink}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={styles.checkboxText}> and </Text>
              <TouchableOpacity onPress={() => {/* Navigate to Privacy Policy */}}>
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
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
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
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
  },
  image: {
    width: 150,
    height: 150,
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
  welcomeText: {
    fontSize: 26,
    fontWeight: 700,
    color: '#191919',
    marginTop: 10,
    fontFamily: 'Product Sans Bold Italic'
   
  },

  subText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    fontWeight: 400,
    fontFamily:'Product Sans Bold Italic'
 

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
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxUnchecked: {
    borderColor: '#666',
  },
  checkboxChecked: {
    borderColor: '#004AAD',
    backgroundColor: '#004AAD',
  },
  checkboxCheckmark: {
    color: '#fff',
    fontSize: 14,
  },
  checkboxText: {
    fontSize: 14,
    color: 'rgba(25,25,25,1)',
    fontFamily: 'SFPRODISPLAYLIGHTITALIC',
    fontWeight: 400
  },
  loginButton: {
    backgroundColor: '#2968FF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,1)',
    fontWeight: 400,
    fontFamily: 'Product Sans Bold Italic',
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#797979',
    fontSize: 14,
    marginTop: 10,
    fontFamily: 'SFPRODISPLAYLIGHTITALIC',
    fontWeight: 500
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
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
});

