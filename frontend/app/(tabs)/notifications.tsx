import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';

interface Notification {
  id: string;
  section: string;
  time: string;
  messageParts: { text: string; bold: boolean }[];
  cancellable?: boolean;
  read?: boolean;
  showSectionHeader?: boolean;
}

const notifications: Notification[] = [
  { 
    id: '1', 
    section: 'Aujourd’hui', 
    time: '9h01', 
    messageParts: [
      { text: 'Le ', bold: false },
      { text: 'Dr. Rozières', bold: true },
      { text: ' a reçu votre demande de rendez-vous pour 10h', bold: false }
    ], 
    cancellable: true 
  },
  { 
    id: '2', 
    section: 'Hier', 
    time: '8h48', 
    messageParts: [
      { text: 'M. Lanson', bold: true },
      { text: ' a accepté votre demande de rendez-vous à 10h hier', bold: false }
    ], 
    read: true 
  },
  { 
    id: '3', 
    section: 'Hier', 
    time: '8h40', 
    messageParts: [
      { text: 'Vous', bold: true },
      { text: ' avez mis à jour votre profil', bold: false }
    ] 
  },
];

interface NotificationItemProps {
  item: Notification;
  showSectionHeader?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ item }) => (
  <View style={styles.notificationContainer}>
    {item.showSectionHeader && <Text style={styles.sectionHeader}>{item.section}</Text>}
    <View style={styles.notification}>
      <View style={styles.notificationContent}>
        {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
        <Text style={styles.message}>
          {item.messageParts.map((part, index) => (
            <Text key={index} style={part.bold ? styles.boldText : null}>
              {part.text}
            </Text>
          ))}
        </Text>
      </View>
      {item.cancellable && (
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      )}
      {item.read && (
        <Ionicons name="checkmark-circle" size={24} color="green" style={styles.readIcon} />
      )}
    </View>
  </View>
);

const App = () => {
  const [displayData, setDisplayData] = useState<Notification[]>([]);

  useEffect(() => {
    const updatedData = notifications.map((item, index) => ({
      ...item,
      showSectionHeader: index === 0 || item.section !== notifications[index - 1]?.section,
    }));
    setDisplayData(updatedData);
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Tout marquer comme lu"
          editable={false}
        />
      </View>
      <FlatList
        data={displayData}
        renderItem={({ item }) => <NotificationItem item={item} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBarContainer: {
    padding: 10,
  },
  searchBar: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 10,
    fontSize: 12,
    textAlign: 'center',
  },
  notificationContainer: {
    paddingHorizontal: 15,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
    marginVertical: 10,
  },
  notification: {
    flexDirection: "row",
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  notificationContent: {
    flex: 1,
  },
  time: {
    fontSize: 15,
    color: '#666',
    marginBottom: 5,
  },
  message: {
    fontSize: 15,
    color: '#000',
  },
  boldText: {
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  readIcon: {
    marginLeft: 10,
  },
});

export default App;