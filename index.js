
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { NavigationContainer } from '@react-navigation/native'; // Import NavigationContainer
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import {store} from './src/Redux/Store';

const AppWithNavigation = () => {
  return (
    <>
    <Provider store={store}>
      <NavigationContainer>
        <App />
      </NavigationContainer>
      <Toast/>
      </Provider>

    </>
  );
};

AppRegistry.registerComponent(appName, () => AppWithNavigation);
