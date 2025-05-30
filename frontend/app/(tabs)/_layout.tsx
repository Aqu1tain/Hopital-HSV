import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Calendar, Hospital, User, Settings } from 'lucide-react-native';
import { useAuth } from '../auth-context';
import { useRouter } from 'expo-router';

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
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'RDV',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          tabBarItemStyle: styles.navItem,
        }}
      />
      <Tabs.Screen
        name="practitioners"
        options={{
          title: 'Praticiens',
          tabBarIcon: ({ color }) => <Hospital color={color} size={24} />,
          tabBarItemStyle: styles.navItem,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
          tabBarItemStyle: styles.navItem,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />, // Using Calendar icon as placeholder; adjust if needed
          href: null, // Désactive l'onglet dans la barre de navigation
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
          tabBarItemStyle: styles.navItem,
          href: null,
        }}
      />
      <Tabs.Screen
        name="practitioner-detail"
        options={{
          title: 'Praticien',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
          tabBarItemStyle: styles.navItem,
          href: null,
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