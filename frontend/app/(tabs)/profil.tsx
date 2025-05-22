import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AppHeader from '../../components/AppHeader';

import { useAuth } from '../auth-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function ProfilScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:3000/auth/logout', { method: 'POST' });
    } catch {}
    logout();
    router.replace('/auth');
    setLoading(false);
  };

  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <AppHeader />
      <View style={styles.container}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>Bienvenue sur votre espace personnel !</Text>
        <TouchableOpacity
          style={{
            marginTop: 32,
            backgroundColor: '#e74c3c',
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 8,
          }}
          onPress={handleLogout}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            {loading ? 'Déconnexion...' : 'Se déconnecter'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    fontFamily: 'Inter',
  },
});
