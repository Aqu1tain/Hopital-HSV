import { View, Text, StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';

export default function ProfilScreen() {
  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <AppHeader />
      <View style={styles.container}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>Bienvenue sur votre espace personnel !</Text>
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
