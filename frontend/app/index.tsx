import { View, Text, StyleSheet, Button, TouchableOpacity, GestureResponderEvent, Image } from 'react-native';
import AppHeader from 'C:/Users/Valentin/Documents/SupdeVinci/B3/Cours/React/learn/Hopital-HSV/frontend/components/AppHeader.tsx';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 10,
  fade: true,
});


function SplashScreenComponent() {
  return (
    <View style={styles.splashScreen}>
      <Image style={styles.image} source={require('C:/Users/Valentin/Documents/SupdeVinci/B3/Cours/React/learn/Hopital-HSV/frontend/assets/images/logo.png')}/>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerGreeting: {
    fontSize: 16,
    color: '#444',
    fontFamily: 'Inter',
  },
  bellIcon: {
    marginLeft: 16,
  },
  splashScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  splashText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Inter',
  },
  image: {
    width: 100,
    height: 100,
  },
});

export default SplashScreenComponent;