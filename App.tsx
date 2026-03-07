import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import FridgeScreen from './src/screens/FridgeScreen';
import PantryScreen from './src/screens/PantryScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import AuthScreen from './src/screens/AuthScreen';
import { isLoggedIn, logout } from './src/services/api';

const Tab = createBottomTabNavigator();

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    isLoggedIn().then(setAuthenticated);
  }, []);

  if (authenticated === null) return null;

  if (!authenticated) {
    return (
      <>
        <StatusBar style="auto" />
        <AuthScreen onAuth={() => setAuthenticated(true)} />
      </>
    );
  }

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
  };

  const LogoutButton = () => (
    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 14 }}>
      <Text style={{ color: '#fff', fontSize: 15 }}>Logout</Text>
    </TouchableOpacity>
  );

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4CAF50',
          headerStyle: { backgroundColor: '#4CAF50' },
          headerTintColor: '#fff',
          headerRight: () => <LogoutButton />,
        }}
      >
        <Tab.Screen
          name="Fridge"
          component={FridgeScreen}
          options={{ title: 'My Fridge' }}
        />
        <Tab.Screen
          name="Pantry"
          component={PantryScreen}
          options={{ title: 'Pantry Staples' }}
        />
        <Tab.Screen
          name="Recipes"
          component={RecipesScreen}
          options={{ title: 'Find Recipes' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
