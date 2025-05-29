import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/app/auth-context';
import { useRouter } from 'expo-router';
import config from '@/config/config';

export default function PractitionerProfilScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const logout = useAuth().logout;

  const handleLogout = async () => {
    const confirmLogout = Platform.OS === 'web'
      ? window.confirm('Voulez-vous vraiment vous déconnecter ?')
      : await new Promise(resolve => {
          Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Confirmer', onPress: () => resolve(true) },
            ],
          );
        });

    if (!confirmLogout) return;

    setLoading(true);
    try {
      await fetch(`${config.API_URL}/auth/logout`, { method: 'POST' });
    } catch {}
    logout();
    router.replace('/auth');
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <Text style={styles.title}>Mon profil praticien</Text>
      <Text style={styles.subtitle}>
        Ici vous pouvez éditer vos informations personnelles et professionnelles.
      </Text>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
      >
        <Text style={styles.logoutText}>
          Se déconnecter
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E4FD1',
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,

  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    paddingLeft: 10,
    paddingRight: 10,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButton: {
    backgroundColor: '#2E4FD1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});
