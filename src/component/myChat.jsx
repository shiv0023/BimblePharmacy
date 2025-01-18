import React from 'react';
import Chat from './Chat';
import { Union, Union2 } from './svgComponent';

const NewChat = ({ navigation }) => {
  const patientInfo = { phn: '5436789567', gender: 'F', age: 30 };

  const footerActions = [
    { label: 'Start\nAssessment', icon: <Union />, onPress: () => console.log('Start Assessment') },
    { label: 'Write\nPrescription', icon: <Union2 />, onPress: () => console.log('Write Prescription') },
  ];

  return (
    <Chat
      navigation={navigation}
      type="New"
      patientInfo={patientInfo}
      headerTitle="Sophia Christopher"
      footerActions={footerActions}
    />
  );
};

const FollowupChat = ({ navigation }) => {
  const patientInfo = { phn: '6345789567', gender: 'F', age: 30 };

  const footerActions = [
    { label: 'Continue\nAssessment', icon: <Union />, onPress: () => console.log('Continue Assessment') },
    { label: 'Review\nPrescription', icon: <Union2 />, onPress: () => console.log('Review Prescription') },
  ];

  return (
    <Chat
      navigation={navigation}
      type="Followup"
      patientInfo={patientInfo}
      headerTitle="Aiden Sheppard"
      footerActions={footerActions}
    />
  );
};

export { NewChat, FollowupChat };
