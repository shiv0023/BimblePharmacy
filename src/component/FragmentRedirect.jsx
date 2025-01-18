import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

const FragmentRedirect = ({ to, params, action = 'navigate' }) => {
  const navigation = useNavigation();

  useEffect(() => {
    switch (action) {
      case 'replace':
        navigation.replace(to, params);
        break;
      case 'reset':
        navigation.reset({
          index: 0,
          routes: [{ name: to, params }],
        });
        break;
      default:
        navigation.navigate(to, params);
    }
  }, []);

  return null;
};

export default FragmentRedirect;