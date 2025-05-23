// PraticiensScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppHeader from '../../components/AppHeader';

const FILTERS = [
  { key: 'specialite', label: 'Spécialité : Toutes' },
  { key: 'conventionne', label: 'Conventionné : Oui' },
  { key: 'paiement', label: 'Paiement : Carte vitale' },
];

const PRACTICIENS = [
  {
    id: '1',
    nom: 'Dr. Rozières',
    spec: 'Médecin Généraliste',
    adresse: '14 rue Boissonade, 75014 PARIS',
    avatar: require('@/assets/images/rozieres.png'),
  },
  {
    id: '2',
    nom: 'Dr. Goldman-Saxe',
    spec: 'Pédiatre',
    adresse: '7 rue Campagne-Première, 75006 PARIS',
    avatar: require('@/assets/images/rozieres.png'),
  },
  {
    id: '3',
    nom: 'Dr. Martinez',
    spec: 'Cardiologue',
    adresse: '2 boulevard du Port Royal, 75006 PARIS',
    avatar: require('@/assets/images/rozieres.png'),
  },
  {
    id: '4',
    nom: 'M. Lanson',
    spec: 'Ostéopathe',
    adresse: '123 boulevard Saint-Michel, 75006 PARIS',
    avatar: require('@/assets/images/rozieres.png'),
  },
  {
    id: '5',
    nom: 'Dr. Petit',
    spec: 'Médecin Généraliste',
    adresse: '2 rue du Panthéon, 75006 PARIS',
    avatar: require('@/assets/images/rozieres.png'),
  },
];

export default function PraticiensScreen() {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const filteredData = PRACTICIENS.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.spec.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={item.avatar} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.nom}</Text>
        <Text style={styles.spec}>{item.spec}</Text>
        <Text style={styles.adresse}>{item.adresse}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader />

        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={[styles.searchInput, { borderColor: focused ? '#fff' : '#fff' }]}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Rechercher un médecin, un praticien"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtres */}
          <View style={styles.filters}>
            <Ionicons name='funnel-outline' size={20} color="#666" />
            {FILTERS.map(f => (
              <TouchableOpacity key={f.key} style={styles.filterBtn}>
                <Text style={styles.filterText}>{f.label}</Text>
                <Ionicons name="chevron-down" size={14} color="#444" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Zone et titre */}
          <View style={styles.zone}>
            <Text style={styles.zoneLabel}>Praticiens à proximité</Text>
            <View style={styles.zoneInfo}>
              <Text style={styles.zoneText}>Zone : Paris 6 (5 km)</Text>
              <TouchableOpacity>
                <Text style={styles.zoneChange}>Changer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Liste */}
          <FlatList
            data={filteredData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    backgroundColor: '#fff',
    paddingHorizontal: 26,
    paddingVertical: 10,
    gap: 23,
    flex:1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#C7C7C7',
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#7B7B7B',
  },
  filters: {
    height: 34,
    alignItems: 'center',
    gap: 10,
    flexDirection: 'row',
    alignSelf: 'stretch',    
  },
  filterBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderColor: '#c7c7c7',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#444',
  },
  zone: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  zoneLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    color: '#222',
  },
  zoneInfo: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
  },
  zoneText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#666',
  },
  zoneChange: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#007AFF',
  },
  list: {
    flex: 1,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,           // Android shadow
    shadowColor: '#000',    // iOS shadow
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineBadge: {
    position: 'absolute',
    left: 44,
    top: 44,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#222',
  },
  spec: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#666',
    marginVertical: 2,
  },
  adresse: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#999',
  },
});
