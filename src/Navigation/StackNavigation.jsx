import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';
import Login from '../component/Login';
import Appointment from '../component/Appointment';
import SplashScreen from '../Screens/SplashScreen';
import Chat from '../component/Chat';
import PatientReport from '../component/PatientForm';
import FollowUpChat from '../component/FollowUpChat';
import PDFViewer from '../component/PdfViewer';

const Stack = createStackNavigator();







export default function MyStack() {
  return (
  
      <Stack.Navigator initialRouteName="Splash" >
        <Stack.Screen name='Splash' component={SplashScreen} options={{headerShown:false,}}/>
        <Stack.Screen name="Login" options={{headerShown:false}}  component={Login} />
        <Stack.Screen name="Appointment" options={{headerShown:false}} component={Appointment} />
        <Stack.Screen name="Chat" options={{headerShown:false}} component={Chat} />
        <Stack.Screen name="PatientReport" options={{headerShown:false}} component={PatientReport} />
        <Stack.Screen name="followupchat" options={{headerShown:false}} component={FollowUpChat} />
        <Stack.Screen name="PDFViewer" options={{ headerShown: false }} component={PDFViewer} />







      </Stack.Navigator>
      
  
  );
}
