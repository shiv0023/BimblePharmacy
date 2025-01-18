import React, { Fragment } from 'react';
import { Dimensions } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../component/Login';
import Appointment from '../component/Appointment';
import SplashScreen from '../Screens/SplashScreen';
import Chat from '../component/Chat';

import FollowUpChat from '../component/FollowUpChat';
import PDFViewer from '../component/PdfViewer';
import TabViewExample from './TabView';
import Call from '../component/Dialer';
const Stack = createStackNavigator();
const { width, height } = Dimensions.get('window');

export default function MyStack() {
  return (
    <Fragment>
      <Stack.Navigator 
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          detachPreviousScreen: true,
          presentation: 'card',
          cardStyle: {
            width: width,
            height: height
          }
        }} 
        initialRouteName="Splash"
      >
        <Stack.Screen 
          name='Splash' 
          component={SplashScreen} 
          options={{
            animationEnabled: false,
            cardStyle: { width: width, height: height }
          }}
        />
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{
            headerLeft: null,
            unmountOnBlur: true,
            cardStyle: { width: width, height: height }
          }}
        />
        <Stack.Screen 
          name="Appointment" 
          component={Appointment} 
          options={{
          
            cardStyle: { width: width, height: height }
          }}
        />
        <Stack.Screen 
         screenOptions={{
          headerShown: false,
         
          
        }}
          name="Chat" 
          component={Chat} 
          options={{
            headerLeft: null,
           animationEnabled: false,
           
            cardStyle: { width: width, height: height }
          }}
        />
     
        <Stack.Screen 
          name="followupchat" 
          component={FollowUpChat} 
          options={{
            headerLeft: null,
            animationEnabled: false,
            cardStyle: { width: width, height: height }
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
          name="TabView" 
          component={TabViewExample} 
          options={{
            headerLeft: null,
            cardStyle: { width: width, height: height }
          }}
        />
          <Stack.Screen 
          name="Call" 
          component={Call} 
          options={{
            headerLeft: null,
            cardStyle: { width: width, height: height }
          }}
        />
      </Stack.Navigator>
    </Fragment>
  );
}
