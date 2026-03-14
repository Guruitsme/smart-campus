import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import useAuthStore from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 120000, retry: 1 } } });

// ── Tab Screens (placeholder) ─────────────────────────────────────────────────
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
    <Text style={{ fontSize: 32, marginBottom: 12 }}>
      {route.name === 'Notes' ? '📄' : route.name === 'Assignments' ? '📝' : route.name === 'Marks' ? '📊' : route.name === 'Timetable' ? '🗓' : '📢'}
    </Text>
    <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>{route.name}</Text>
    <Text style={{ color: '#94a3b8', marginTop: 8 }}>Screen ready for implementation</Text>
  </View>
);

// ── Main Tab Navigator ────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        tabBarIcon: ({ color, focused }) => {
          const icons = { Home: '🏠', Notes: '📄', Assignments: '📝', Marks: '📊', More: '⚙️' };
          return <Text style={{ fontSize: focused ? 22 : 20 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Notes" component={PlaceholderScreen} />
      <Tab.Screen name="Assignments" component={PlaceholderScreen} />
      <Tab.Screen name="Marks" component={PlaceholderScreen} />
      <Tab.Screen name="More" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
function AppNavigator() {
  const { isAuthenticated, initialize } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <StatusBar style="dark" />
      <AppNavigator />
    </QueryClientProvider>
  );
}
