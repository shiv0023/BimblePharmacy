import React, { Fragment } from 'react';
import { Dimensions } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import Login from '../component/Login';
import Appointment from '../component/Appointment';
import SplashScreen from '../Screens/SplashScreen';
import Chat from '../component/Chat';


import PDFViewer from '../component/PdfViewer';

import Call from '../component/Dialer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createStackNavigator();
const { width, height } = Dimensions.get('window');

export default function MyStack() {
  return (
    <SafeAreaProvider>
      <Fragment>
        <Stack.Navigator 
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
            detachPreviousScreen: false,
            presentation: 'modal',
            cardStyle: {
              backgroundColor: '#0049F8'
            },
            contentStyle: {
              backgroundColor: '#0049F8'
            },
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            }),
          }} 
          initialRouteName="Splash"
        >
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen} 
            options={{
              animationEnabled: false
            }}
          />
          
          <Stack.Screen 
            name="Login" 
            component={Login}
            options={{
              animationEnabled: false
            }}
          />

          <Stack.Screen 
            name="Appointment" 
            component={Appointment}
            options={{
              gestureEnabled: true,
              cardOverlayEnabled: false,
              animationEnabled: true,
              unmountOnBlur: false,
              freezeOnBlur: false,
              detachPreviousScreen: false
            }}
          />

          <Stack.Screen 
            name="Chat" 
            component={Chat}
            options={{
            
            }}
          />

          <Stack.Screen 
            name="PDFViewer" 
            component={PDFViewer} 
            options={{
              headerLeft: null,
              cardStyle: { width: width, height: height }
            }}
          />
          
            <Stack.Screen 
            name="Calls" 
            component={Call} 
            options={{
              headerLeft: null,
              cardStyle: { width: width, height: height }
            }}
          />
        </Stack.Navigator>
      </Fragment>
    </SafeAreaProvider>
  );
}
