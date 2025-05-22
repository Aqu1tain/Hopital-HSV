import { Tabs } from 'expo-router';
import React from 'react';
import { Calendar, Hospital, User } from 'lucide-react-native';

import { useAuth } from '../auth-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5671DA',
        tabBarInactiveTintColor: '#B0B0B0',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'RDV',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />, // calendar icon
        }}
      />
      <Tabs.Screen
        name="practitioners"
        options={{
          title: 'Praticiens',
          tabBarIcon: ({ color }) => <Hospital color={color} size={24} />, // hospital icon
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />, // user icon
        }}
      />
    </Tabs>
  );
}
