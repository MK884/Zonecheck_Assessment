import React from 'react';
import { StatusBar } from 'react-native';
import TasksScreen from './src/screens/TasksScreens';
import AuthScreen from './src/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Loading is handled in AuthScreen
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      {user ? <TasksScreen /> : <AuthScreen />}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;