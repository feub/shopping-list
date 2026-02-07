import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen, SignupScreen } from '../screens/AuthScreen';
import type { AuthStackParamList } from './types';
import { useTheme } from '../hooks/useTheme';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Welcome' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
};
