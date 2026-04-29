import React, { useEffect, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_700Bold,
  Fraunces_700Bold_Italic,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from '@expo-google-fonts/manrope';
import FridgeScreen from './src/screens/FridgeScreen';
import PantryScreen from './src/screens/PantryScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import AuthScreen from './src/screens/AuthScreen';
import { isLoggedIn, logout } from './src/services/api';
import { AuthContext } from './src/auth';
import { colors, FONT, MAX_CONTENT } from './src/theme';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    card: colors.paper,
    text: colors.ink,
    border: colors.hairline,
    primary: colors.terracotta,
  },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={tabStyles.bar}>
      <View style={tabStyles.inner}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label =
          (typeof options.tabBarLabel === 'string' ? options.tabBarLabel : undefined) ?? route.name;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
        };
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={String(label)}
            onPress={onPress}
            activeOpacity={0.7}
            style={tabStyles.item}
          >
            <View style={[tabStyles.dot, focused && tabStyles.dotActive]} />
            <Text
              numberOfLines={1}
              style={[tabStyles.label, focused && tabStyles.labelActive]}
            >
              {String(label)}
            </Text>
          </TouchableOpacity>
        );
      })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 14,
    paddingBottom: 22,
    minHeight: 78,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MAX_CONTENT,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  dotActive: { backgroundColor: colors.terracotta },
  label: {
    fontFamily: FONT.serifItalic,
    fontSize: 17,
    letterSpacing: 0.2,
    color: colors.inkFaint,
  },
  labelActive: { color: colors.terracotta },
});

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_500Medium_Italic,
    Fraunces_700Bold,
    Fraunces_700Bold_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  useEffect(() => {
    isLoggedIn().then(setAuthenticated);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', colors.paper);
    document.documentElement.style.backgroundColor = colors.paper;
    document.body.style.backgroundColor = colors.paper;
  }, []);

  if (authenticated === null || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.terracotta} />
      </View>
    );
  }

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen onAuth={() => setAuthenticated(true)} />
      </>
    );
  }

  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="dark" />
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="fridge" component={FridgeScreen} options={{ tabBarLabel: 'fridge' }} />
          <Tab.Screen name="pantry" component={PantryScreen} options={{ tabBarLabel: 'pantry' }} />
          <Tab.Screen name="cook" component={RecipesScreen} options={{ tabBarLabel: 'cook' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
