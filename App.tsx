/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, useColorScheme } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
// import PaymentTest from './src/screens/PaymentTest';
import AdvancedPaymentTest from './src/screens/AdvancedPaymentTest';
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        {/* <PaymentTest /> */}
        <AdvancedPaymentTest />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
