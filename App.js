

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Appointment from './src/component/Appointment'
import PatientReport from './src/component/PatientForm'
import Chat from './src/component/FollowUpChat'
import FollowUpChat from './src/component/FollowUpChat'
import Login from './src/component/Login'

import Stack from './src/Navigation/StackNavigation'
import MyStack from './src/Navigation/StackNavigation'

import DrawerNavigator from './src/Navigation/DrawerNavigation'


const App = () => {
  return (

    <View style={{flex:1}}>
  <DrawerNavigator/>


    </View>
   
 
    
  )
}

export default App

const styles = StyleSheet.create({})