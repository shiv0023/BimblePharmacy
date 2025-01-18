import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native'

import { FileIcon, MenuIcon, Union, Union2,PatientFemaleImg,AppointmentUserIcon,Call } from './svgComponent'

const { width, height } = Dimensions.get('window')

const FollowupChat = ({ navigation }) => {
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
      profile: AppointmentUserIcon 
    },
    {
      id: 3,
      type: 'patient',
      text: 'Lorem Ipsum available the majority',
      files: ['Outbundle.pdf', 'Intakeform.pdf', 'CBC.pdf', 'KFTReport.pdf'],
      profile:PatientFemaleImg
    },
    {
      id: 4,
      type: 'doctor',
      text: 'Lorem Ipsum available the majority',
      files: ['Prescription....'],
      profile: AppointmentUserIcon
    },
  ]


  const openPDF = ({uri}) => {
  
    navigation.navigate('PDFViewer', { uri });

  };


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
                onPress={() =>openPDF('https://example.com/Prescription.pdf')}
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
        <AppointmentUserIcon style={styles.profileImage} />
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
          <MenuIcon onPress={() => navigation.openDrawer()} />
          </TouchableOpacity>
          <Text variant="pageHeading" style={styles.headerTitle}>Sophia Christopher</Text>
          <TouchableOpacity>
            <Call style={styles.phoneIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.patientInfo}>
          <Text style={styles.patientInfoText}>
            <Text style={styles.phnLabel}>PHN:</Text> 5436789567 / F / 30 Years
          </Text>
          <View style={styles.newButtonContainer}>
            <Text style={styles.newButton}>Followup</Text>
          </View>
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.line} />
          <Text variant="accent" style={styles.dateText}>Thu, Nov 7, 2024</Text>
          <View style={styles.line} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          style={styles.messageList}
        />

<View style={styles.footer}>
  <View style={styles.footerButtonContainer}>
    <TouchableOpacity style={styles.footerButton}>
      <Union style={styles.footerIcon} />
      <Text style={styles.footerButtonText}>
        Start{'\n'}Assessment
      </Text>
    </TouchableOpacity>
  </View>
  <View style={styles.footerButtonContainer}>
    <TouchableOpacity style={styles.footerButton}>
      <Union2 style={styles.footerIcon} />
      <Text style={styles.footerButtonText}>
        Write{'\n'}Prescription
      </Text>  
    </TouchableOpacity>
  </View>
</View>

  {/* <View style={styles.footerButtonContainer}>
          <TouchableOpacity style={styles.footerButton}>
            <Union style={styles.footerIcon} />
            <Text style={styles.footerButtonText}>
              Start{'\n'}Assessment
            </Text>
          </TouchableOpacity>
         
          <TouchableOpacity style={styles.footerButton}>
            <Union2 style={styles.footerIcon} />
            <Text style={styles.footerButtonText}>Write{'\n'}Prescription</Text>  
          </TouchableOpacity>
        </View> */}
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: width > 600 ? 0 : 0,
  },
  statusBarBackground: {
    backgroundColor: '#0057FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0057FF',
    paddingVertical: 15,
    paddingHorizontal: width > 600 ? 20 : 16,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
   
    fontSize: width > 600 ? 20 : 20,
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
    backgroundColor: 'rgba(220, 232, 221, 1)',
  },
  patientInfoText: {
    fontSize: width > 600 ? 20 : 18,
    color: '#191919',
  },
  phnLabel: {
    color: '#191919',
    fontSize: width > 600 ? 20 : 18,
    fontWeight: '700',
  },
  newButtonContainer: {
    backgroundColor: '#008D00',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  newButton: {
    color: '#ffffff',
    fontSize: width > 600 ? 14 : 12,
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
    fontSize: width > 600 ? 16 : 14,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    paddingHorizontal: width > 600 ? 20 : 10,
  },
  doctorMessageContainer: {
    justifyContent: 'flex-end',
  },
  patientMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageContent: {
    flex: 1,
    maxWidth: width > 600 ? '60%' : '75%',
    marginHorizontal: 12,
  },
  messageBox: {
  
    padding: 12,
  },
  doctorMessage: {
    backgroundColor: '#0057FF',
    alignSelf: 'flex-end',
    borderTopLeftRadius: 10,
   
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  patientMessage: {
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 94, 173, 0.4)',
  },
  messageText: {
    fontSize: width > 600 ? 17 : 15,
    lineHeight: 20,
    color: '#FFFFFF',
    fontFamily: 'SFPRODISPLAYLIGHTITALIC',
  },
  doctorText: {
    color: '#FFFFFF',
    fontWeight: 400,
    fontFamily: 'Product Sans Regular',
    fontSize: width > 600 ? 17 : 15,
  },
  patientText: {
    color: '#191919',
    fontWeight: 400,
    fontFamily: 'Product Sans Regular',
    fontSize: width > 600 ? 17 : 15,
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
    borderRadius: 4,
    padding: 6,
    borderColor: 'rgba(248, 94, 173, 0.4)',
   
  },
  fileName: {
    fontSize: 11,
    color: '#191919',
    marginLeft: 6,
    fontWeight:400,
    fontFamily:'Product Sans Regular'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: width > 600 ? 20 : 10,
  },
  footerButtonContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent:'space-between',
    margin:10
  },
  footerButton: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E6E8EC',
    borderRadius: 20,
    gap: width > 600 ? 40 : 30,
    paddingTop: width > 600 ? 28 : 20,
    paddingBottom: width > 600 ? 28 : 18,
    paddingLeft: width > 600 ? 28 : 18,
    paddingRight: width > 600 ? 28 : 18,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 2,
  },
  footerIcon: {
    marginBottom: 5,
    width: 24,
    height: 24,
  },
  footerButtonText: {
    textAlign: 'left',
    fontWeight: 500,
    fontSize: width > 600 ? 20 : 18,
    fontFamily: 'SF Pro Display',
  },
  profileImageContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
})

export default FollowupChat