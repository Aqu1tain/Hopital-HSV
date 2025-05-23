import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../app/auth-context';
import { useRouter } from 'expo-router';
import { useUserData } from '../hooks/useUserData';
import { Bell } from 'lucide-react-native';

export default function AppHeader() {
  const { logout } = useAuth();
  const { user, isLoading } = useUserData();
  const router = useRouter();

  // Si les données sont en cours de chargement, afficher un indicateur minimal
  if (isLoading) {
    return (
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerGreeting}>Bonjour</Text>
          <Text style={styles.headerName}><Text style={{fontWeight: 'bold', fontFamily: 'Inter-Bold'}}>Chargement...</Text></Text>
        </View>
        <Bell color="#222" size={22} style={styles.bellIcon} />
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerTextContainer}>
        {user ? (
          <View>
            <Text style={styles.headerGreeting}>Bonjour</Text>
            <Text style={styles.headerName}><Text style={{fontWeight: 'bold', fontFamily: 'Inter-Bold'}}>{user.first_name || user.email.split('@')[0]} {user.last_name ? user.last_name.toUpperCase() : ''}</Text></Text>
          </View>
        ) : (
          <View>
            <Text style={styles.headerGreeting}>Bonjour</Text>
            <Text style={styles.headerName}><Text style={{fontWeight: 'bold', fontFamily: 'Inter-Bold'}}>Invité</Text></Text>
          </View>
        )}
      </View>
      <View style={styles.rightSection}>
        {!user ? (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginText}>Se connecter</Text>
          </TouchableOpacity>
        ) : (null) }
        <Bell color="#222" size={22} style={styles.bellIcon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16, // for safe area
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerGreeting: {
    fontSize: 16,
    color: '#444',
    fontFamily: 'Inter',
  },
  headerName: {
    fontSize: 18,
    color: '#222',
    marginTop: 2,
    fontFamily: 'Inter-Bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 5,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  loginText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bellIcon: {
    marginLeft: 16,
  },
});
