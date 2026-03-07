import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import FridgeScreen from './src/screens/FridgeScreen';
import PantryScreen from './src/screens/PantryScreen';
import RecipesScreen from './src/screens/RecipesScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4CAF50',
          headerStyle: { backgroundColor: '#4CAF50' },
          headerTintColor: '#fff',
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
