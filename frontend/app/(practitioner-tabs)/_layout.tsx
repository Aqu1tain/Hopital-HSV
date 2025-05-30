import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Calendar, Users, User } from 'lucide-react-native';

import { useAuth } from '../auth-context';
import { useRouter } from 'expo-router';

export default function PractitionerTabLayout() {
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
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}>
      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          tabBarItemStyle: styles.navItem
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          tabBarItemStyle: styles.navItem
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
          tabBarItemStyle: styles.navItem
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#fff',
    height: 65,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
});
