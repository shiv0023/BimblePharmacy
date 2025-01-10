import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {NavigationContainer} from '@react-navigation/native'; // Import NavigationContainer
import Toast from 'react-native-toast-message';
import {Provider} from 'react-redux';
import {store} from './src/Redux/Store';
import {ThemeProvider} from './src/theme';
const AppWithNavigation = () => {
  return (
    <>
      <ThemeProvider>
        <Provider store={store}>
          <NavigationContainer>
            <App />
          </NavigationContainer>
          <Toast />
        </Provider>
      </ThemeProvider>
    </>
  );
};

AppRegistry.registerComponent(appName, () => AppWithNavigation);
