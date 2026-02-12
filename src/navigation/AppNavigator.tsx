import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { EditSavedListScreen } from '../screens/EditSavedListScreen';
import type { RootStackParamList } from './types';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { user, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isAuthenticated = !!user;

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="EditSavedList"
              component={EditSavedListScreen}
              options={{
                headerShown: true,
                presentation: 'modal',
                title: 'Edit Saved List',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
