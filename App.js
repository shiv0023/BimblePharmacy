

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Appointment from './src/component/Appointment'
import PatientReport from './src/component/PatientForm'
import Chat from './src/component/FollowUpChat'
import FollowUpChat from './src/component/FollowUpChat'
import Login from './src/component/Login'

import Stack from './src/Navigation/StackNavigation'
import MyStack from './src/Navigation/StackNavigation'
import Toast from 'react-native-toast-message'



const App = () => {
  return (

    <View style={{flex:1}}>
     {/* <Toast/> */}
<MyStack/>
{/* <Chat/> */}
{/* <Appointment/> */}
    </View>
   
 
    
  )
}

export default App

const styles = StyleSheet.create({})