
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationAccessProvider } from './src/context/NotificationAccessContext';
import NotificationAccessPrompt from './src/components/NotificationAccessPrompt';

const App = () => {
  return (
    <SafeAreaProvider>
      <NotificationAccessProvider>
        <AppNavigator />
        <NotificationAccessPrompt />
      </NotificationAccessProvider>
    </SafeAreaProvider>
  );
};

export default App;
