import { View, Text, StyleSheet, Button, TouchableOpacity, GestureResponderEvent } from 'react-native';
import AppHeader from '../../components/AppHeader';

type RDVBtn = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
};

type Card = {
  doctorName: string;
  details: string;
  onPress: (event: GestureResponderEvent) => void;
}

const RDVButton: React.FC<RDVBtn> = ({title,onPress}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
      
  );
};

const CardPrac: React.FC<Card> = ({ doctorName, details, onPress }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.divCard}>
          <Text style={styles.cardTitle}>{doctorName}</Text>
          <Text style={styles.subtitle}>{details}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Programmer un rappel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.container}>
        <Text style={[styles.typicalText, { lineHeight:50 }]}>Vous n’avez pas de rendez-vous prévu aujourd’hui.</Text>
        <RDVButton
          title="Prendre un rendez vous"
          onPress={() => alert('Bouton appuyé')}
        />
      </View>
      <View style={[styles.header, { flexDirection: 'column' }]}>
        <Text style={[styles.typicalText, {alignSelf: 'flex-start'}]}>Vos prochains rendez-vous</Text>
        <View style={[styles.container, { display: 'flex'}]}>
          <CardPrac
          doctorName="Dr. Rozières - Généraliste"
          details="Demain 9h - rue boissonade"
          onPress={() => alert('Bouton appuyé')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  typicalText: {
    color: '#000',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: 500,
    fontStyle: 'normal',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: 'black',
    fontSize: 10, 
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'left',
  },
  button: {
    marginLeft: 20, // espace entre le texte et le bouton
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E4FD1E5',
  },
  buttonText: {
    color: '#FFF',
    textAlign: 'right',
    fontFamily: 'Inter',
    fontSize: 15, 
    fontStyle: 'normal',
    fontWeight: '700',
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
  divCard: {
    flex: 1, // occupe tout l’espace dispo à gauche
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  card: {
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,   
  },
  subtitle: {
    color: 'black',
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: '400',
    textAlign: 'center',
  },
});
