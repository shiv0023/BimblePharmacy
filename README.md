This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.





import React from 'react'
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native'

export default function AppointmentList() {
  const appointments = [
    {
      id: '1',
      name: 'Sophia Christopher',
      phn: '5436789567',
      gender: 'F',
      age: '30',
      complaint: 'Experience Fatigue due to lack of sleep.',
      status: 'N',
      avatar: '/placeholder.svg',
    },
    {
      id: '2',
      name: 'Aiden Sheppard',
      phn: '6345789567',
      gender: 'M',
      age: '25',
      complaint: 'Experience Fatigue due to lack of sleep.',
      status: 'F',
      isWaiting: true,
      avatar: '/placeholder.svg',
    },
    {
      id: '3',
      name: 'Aiden Sheppard',
      phn: '6345789567',
      gender: 'M',
      age: '25',
      complaint: 'Experience Fatigue due to lack of sleep.',
      status: 'F',
      isWaiting: true,
      avatar: '/placeholder.svg',
    },
  ]

  const [activeTab, setActiveTab] = React.useState('Today')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <View style={styles.menuIcon} />
          <View style={[styles.menuIcon, { marginTop: 4 }]} />
          <View style={[styles.menuIcon, { marginTop: 4 }]} />
        </TouchableOpacity>
        <Text style={styles.title}>Appointments</Text>
        <Image
          source={{ uri: '/placeholder.svg' }}
          style={styles.profileImage}
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Today' && styles.activeTab]}
          onPress={() => setActiveTab('Today')}
        >
          <Text style={[styles.tabText, activeTab === 'Today' && styles.activeTabText]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('Upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.appointmentList}>
        {appointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <View style={styles.patientInfo}>
                <Image
                  source={{ uri: appointment.avatar }}
                  style={styles.patientImage}
                />
                <View>
                  <Text style={styles.patientName}>{appointment.name}</Text>
                  <View style={styles.patientDetails}>
                    <Text style={styles.phnText}>PHN: {appointment.phn}</Text>
                    <Text style={styles.detailText}>{appointment.gender}</Text>
                    <Text style={styles.detailText}>{appointment.age} Years</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: appointment.status === 'N' ? '#4169E1' : '#4CAF50' }]}>
                <Text style={styles.statusText}>{appointment.status}</Text>
              </View>
            </View>
            <Text style={styles.complaintText}>{appointment.complaint}</Text>
            {appointment.isWaiting && (
              <View style={styles.waitingBanner}>
                <Text style={styles.waitingText}>Waiting</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {activeTab === 'Today' && (
        <TouchableOpacity style={styles.continueButton}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4169E1',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    width: 20,
    height: 2,
    backgroundColor: '#fff',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#4169E1',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  activeTabText: {
    color: '#fff',
  },
  appointmentList: {
    flex: 1,
  },
  appointmentCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  patientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E5E5E5',
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  patientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phnText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  complaintText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  waitingBanner: {
    backgroundColor: '#F5F6F8',
    padding: 8,
    marginTop: 8,
    borderRadius: 4,
  },
  waitingText: {
    color: '#666',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#4169E1',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})



background: linear-gradient(172.03deg, #06D001 5.67%, #008D00 93.42%);



#import <UIKit/UIKit.h>

#import <React/RCTAppDelegate.h>


int main(int argc, char *argv[])
{
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
  }
}
              












