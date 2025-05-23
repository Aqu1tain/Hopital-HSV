import { View, Text, StyleSheet, Image } from 'react-native';
import AppHeader from '../../components/AppHeader';
import React from 'react';

const Bandeau = () => {
  return <View style={styles.bandeau}></View>
}

export default function ProfilScreen() {
  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <AppHeader />
      <Bandeau />
      <View style={styles.imageWrapper}>
        <Image
          source={require('@/assets/images/pdp.png')}
          style={styles.image}
          />
          <Text style={styles.pseudo}>Valentin LAMOUCHE</Text>
      </View>
      <View style={styles.container}>
          <Text style={[styles.titre, {marginTop: -100}]}>Informations personnelles</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 33,
    backgroundColor: '#fff',
  },
  titre: {
    color: '#000', 
    fontSize: 18, 
    fontStyle: 'normal', 
    fontWeight: '600', 
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    fontFamily: 'Inter',
  },
  bandeau: {
    height: 177,
    width: '100%',
    backgroundColor: '#007BFF',
  },
  imageWrapper: {
    position: 'absolute',
    top: 177, 
    left: '50%',
    transform: [{ translateX: -80 }], 
    zIndex: 2,
    alignSelf: 'center', 
    alignItems: 'center',
  },
  pseudo: {
    marginTop: 10,
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '600',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff', // Optionnel : bord blanc autour de l'image
  },
});
