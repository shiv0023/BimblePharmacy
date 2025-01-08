import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import Call, { PatientFemaleImg } from './svgComponent'
import { FileIcon, MenuIcon, Union, Union2 } from './svgComponent'

const Chat = ({ navigation }) => {
  const messages = [
    {
      id: 1,
      type: 'patient',
      text: 'Experience Fatigue due to lack of sleep',
      profile:PatientFemaleImg
    },
    {
      id: 2,
      type: 'doctor',
      text: 'Lorem Ipsum available the majority',
      files: [],
      profile: require('../Assets/logo.svg'),
    },
    {
      id: 3,
      type: 'patient',
      text: 'Lorem Ipsum available the majority',
      files: ['Outbound.zip', 'Intakeform.pdf', 'CBC.pdf', 'KFTReport.pdf'],
      profile:PatientFemaleImg
    },
    {
      id: 4,
      type: 'doctor',
      text: 'Lorem Ipsum available the majority',
      files: ['Prescription.pdf'],
      profile: require('../Assets/logo.svg'),
    },
  ]

  useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('light-content')
    } else {
      StatusBar.setBackgroundColor('#0057FF')
      StatusBar.setBarStyle('light-content')
    }
  }, [])

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === 'doctor' ? styles.doctorMessageContainer : styles.patientMessageContainer,
      ]}
    >
      {item.type === 'patient' && (
      <PatientFemaleImg style={styles.profileImage}/>
      )}
      <View style={styles.messageContent}>
        <View
          style={[
            styles.messageBox,
            item.type === 'doctor' ? styles.doctorMessage : styles.patientMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.type === 'doctor' ? styles.doctorText : styles.patientText,
            ]}
          >
            {item.text}
          </Text>
     
        {item.files && item.files.length > 0 && (
          <View style={styles.fileContainer}>
            {item.files.map((file, index) => (
              <TouchableOpacity
                // onPress={() => navigation.navigate('PatientReport')}
                key={index}
                style={styles.fileButton}
              >
                <FileIcon />
                <Text style={styles.fileName}>{file}</Text>
              </TouchableOpacity>
            ))}
          </View>
            
        )}
         </View>
      </View>
      {item.type === 'doctor' && (
        <Image source={item.profile} style={styles.profileImage} />
      )}
    </View>
  )

  return (
    <>
      {Platform.OS === 'ios' && <SafeAreaView style={styles.statusBarBackground} />}
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent={false}
          backgroundColor="#0057FF"
          barStyle="light-content"
        />
        <View style={styles.header}>
          <TouchableOpacity>
            <MenuIcon style={styles.menuIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sophia Christopher</Text>
          <TouchableOpacity>
            <Call style={styles.phoneIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.patientInfo}>
          <Text style={styles.patientInfoText}>
            <Text style={styles.phnLabel}>PHN:</Text> <Text style={{color:'black',fontSize:18}}>5436789567 / F / 30 Years</Text>
          </Text>
          <View style={styles.newButtonContainer}>
            <Text style={styles.newButton}>New</Text>
          </View>
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.line} />
          <Text style={styles.dateText}>Thu, Nov 7, 2024</Text>
          <View style={styles.line} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          style={styles.messageList}
        />

<View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton}>
            <Union style={styles.footerIcon} />
            <Text style={styles.footerButtonText}>Start 
             
             </Text>
             <Text style={{    fontSize: 15,
    fontWeight: '600',
    color: '#191919',}}>Assessment</Text>
          </TouchableOpacity>
         
          <TouchableOpacity style={styles.footerButton}>
            <Union2 style={styles.footerIcon} />
            <Text style={styles.footerButtonText}>Write </Text>
              
            <Text style={{    fontSize: 15,
    fontWeight: '600',
    color: '#191919',}}>
            Prescription</Text>  
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBarBackground: {
    backgroundColor: '#0057FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0057FF',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 25,
    fontWeight: '700',
    marginLeft: 12,
    fontFamily:'Product Sans Bold'
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  phoneIcon: {
    width: 24,
    height: 24,
  },
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(223, 233, 252, 1)',
  },
  patientInfoText: {
    fontSize: 15,
    color: '#666',
  },
  phnLabel: {
    color: '#191919',
    fontSize: 17,
    fontWeight: '600',
    fontFamily:'SFPRODISPLAYLIGHTITALIC'
  },
  newButtonContainer: {
    backgroundColor: '#0057FF',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  newButton: {
    color: '#fff',
    fontSize: 12,
    fontWeight:400
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dateText: {
    marginHorizontal: 12,
    color: '#191919',
    fontSize: 15,
    fontWeight: '450',
    fontFamily:'Product Sans Regular'
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  doctorMessageContainer: {
    justifyContent: 'flex-end',
  },
  patientMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%',
    marginHorizontal: 12,
  },
  messageBox: {
    borderRadius: 12,
    padding: 12,
    
  },
  doctorMessage: {
    backgroundColor: '#0049F8',
    alignSelf: 'flex-end',

  },
  patientMessage: {
  
    borderWidth: 1,
    borderColor: 'rgba(248, 94, 173, 0.4)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color:'#FFFFFF',
    fontWeight:400,
    fontSize:16,
    fontFamily:'SFPRODISPLAYLIGHTITALIC'
  },
  doctorText: {
    color: '#FFFFFF',
  },
  patientText: {
    color: '#191919',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  fileContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
     
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 6,
    padding: 8,
    borderColor: 'rgba(248, 94, 173, 0.4)',
    
  },
  fileName: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    color:'black',
    fontWeight:'400'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 15,
    gap: 16,
  
  },
  footerButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    padding: 16,
   
  },
  footerIcon: {
    marginTop: 15,
  },
  footerButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#191919',
  marginTop:40
  },
})

export default Chat