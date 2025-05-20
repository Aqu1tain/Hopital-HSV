import { Tabs } from 'expo-router';
import React = require('react');
import { Calendar, Hospital, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle:{
          height:70,
        },
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
