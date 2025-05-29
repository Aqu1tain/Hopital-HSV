import { Tabs } from 'expo-router';
import React from 'react';
import { Calendar, Hospital, User } from 'lucide-react-native';

export default function TabLayout() {
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
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="practitioners"
        options={{
          title: 'Praticiens',
          tabBarIcon: ({ color }) => <Hospital color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          href: null, // Désactive l'onglet dans la barre de navigation
        }}
      />
    </Tabs>
  );
}