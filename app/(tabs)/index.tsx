import { View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerGreeting}>Bonjour</Text>
          <Text style={styles.headerName}><Text style={{fontWeight: 'bold'}}>Valentin LAMOUCHE</Text></Text>
        </View>
        <Bell color="#222" size={22} style={styles.bellIcon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
    fontFamily: 'Inter',
  },
  bellIcon: {
    marginLeft: 16,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Inter',
  },
});
