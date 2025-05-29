import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router'; // Ajout de l'import pour expo-router

export default function AppHeader() {
  const handleBellPress = () => {
    router.push('./notifications_prac'); // Redirige vers notifications_prac
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerGreeting}>Bonjour</Text>
        <Text style={styles.headerName}>
          <Text style={{ fontWeight: 'bold', fontFamily: 'Inter-Bold' }}>Valentin LAMOUCHE</Text>
        </Text>
      </View>
      <TouchableOpacity onPress={handleBellPress}>
        <Bell color="#222" size={22} style={styles.bellIcon} />
      </TouchableOpacity>
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
  bellIcon: {
    marginLeft: 16,
  },
});