// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import TranslatorScreen from './src/screens/TranslatorScreen';
import SettingsScreen   from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Translator"
          screenOptions={{
            headerStyle: { backgroundColor: '#c1272d' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          <Stack.Screen
            name="Translator"
            component={TranslatorScreen}
            options={({ navigation }) => ({
              title: '🇲🇦 Darija Translator',
              headerRight: () => (
                <React.Fragment>
                  <SettingsButton onPress={() => navigation.navigate('Settings')} />
                </React.Fragment>
              ),
            })}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: '⚙️ Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// Simple header button component
function SettingsButton({ onPress }) {
  const { TouchableOpacity, Text } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} style={{ marginRight: 14 }}>
      <Text style={{ color: 'white', fontSize: 22 }}>⚙️</Text>
    </TouchableOpacity>
  );
}
