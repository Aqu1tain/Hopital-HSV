import { View, Text, StyleSheet, Button, TouchableOpacity, GestureResponderEvent } from 'react-native';
import AppHeader from '../../components/AppHeader';

type RDVBtn = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
};

type Card = {
  doctorName: string;
  details: string;
}

const RDVButton: React.FC<RDVBtn> = ({title,onPress}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
      
  );
};

const CardPrac: React.FC<Card> = ({doctorName,details}) => {
  return (
    //<View
  )
}

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
      <View style={styles.header}>
        <Text style={styles.typicalText}>Vos prochains rendez-vous</Text>
        <View style={styles.header}>

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
  button: {
    width: '60%',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 15,
    paddingBottom: 15,
    opacity: 0.9,
    borderRadius: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
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
});
