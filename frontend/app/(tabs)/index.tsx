import { View, Text, StyleSheet, Button, TouchableOpacity, GestureResponderEvent } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { useCallback, useEffect, useState } from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';


SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
};

const RDVButton: React.FC<Props> = ({title,onPress}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
      
  );
};

export default function splashScreen(){
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    try{
      await Font.loadAsync(Entypo.font);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (e) {
      console.warn(e);
    } finally {
      setAppIsReady(true);
    }
  }

  prepare();
},[]

export function HomeScreen() {  
  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.container}>
        <Text style={styles.typicalText}>Vous n’avez pas de rendez-vous prévu aujourd’hui.</Text>
        <RDVButton
          title="Prendre un rendez vous"
          onPress={() => alert('Bouton appuyé')}
        />
      <Text style={styles.title}>Bienvenue dans votre nouvelle app !</Text>
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
    textAlign: 'right',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: 500,
    fontStyle: 'normal',
    lineHeight: 500,
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
    lineHeight: undefined, 
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


