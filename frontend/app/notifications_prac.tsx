import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, TextInput, Switch } from 'react-native';
import React, { useState } from 'react';

interface TextProps {
  textView: string;
  textSecondaryView: string;
  onChangeText?: (text: string) => void;
  isEditing?: boolean;
  error?: string;
}

const Texte: React.FC<TextProps> = ({ textView, textSecondaryView, onChangeText, isEditing, error }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  const handleTextLayout = (event: any) => {
    const { lines } = event.nativeEvent;
    setIsTruncated(lines.length > 1);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.textContainer}>
      <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">{textView}</Text>
      <View style={styles.infoContainer}>
        {isEditing ? (
          <>
            <TextInput
              style={[styles.textInput, error && styles.textInputError]}
              value={textSecondaryView}
              onChangeText={onChangeText}
              autoCapitalize="none"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        ) : (
          <View style={styles.textWrapper}>
            <Text
              style={styles.textSecondary}
              numberOfLines={isExpanded ? undefined : 1}
              ellipsizeMode="tail"
              onTextLayout={handleTextLayout}
            >
              {textSecondaryView}
            </Text>
            {isTruncated && !isExpanded && (
              <TouchableOpacity onPress={toggleExpand}>
                <Text style={styles.ellipsis}>...</Text>
              </TouchableOpacity>
            )}
            {isExpanded && (
              <TouchableOpacity onPress={toggleExpand}>
                <Text style={styles.ellipsis}>Voir moins</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// Interface pour un rendez-vous
interface Appointment {
  name: string;
  time: string;
  status?: 'accepted' | 'rejected' | null; // null pour les rendez-vous d'aujourd'hui (pas encore de statut)
}

export default function AppointmentScreen() {
  // Données des rendez-vous
  const [appointmentsToday, setAppointmentsToday] = useState<Appointment[]>([
    { name: 'M. Valentin Lamouche', time: 'à 10h aujourd’hui' },
    { name: 'M. Philippe Lacheteau', time: 'à 11h aujourd’hui' },
    { name: 'Mme. Sophie Marceau', time: 'à 9h aujourd’hui', status: 'accepted' },
    { name: 'M. Théophane Grimaux', time: 'à 8h aujourd’hui', status: 'accepted' },
  ]);

  const [appointmentsYesterday, setAppointmentsYesterday] = useState<Appointment[]>([
    { name: 'M. Julien Song', time: 'avant rendez-vous hier à 17h', status: 'accepted' },
    { name: 'M. Philippe Etchebest', time: 'annulé son rendez-vous prévu hier à 16h', status: 'rejected' },
    { name: 'Mme Karina Denvers', time: 'avant rendez-vous hier à 15h', status: 'accepted' },
    { name: 'M. Théo Pulpino', time: 'avant rendez-vous hier à 14h', status: 'accepted' },
    { name: 'M. Lucas Hauchard', time: 'avant rendez-vous hier à 14h', status: 'accepted' },
  ]);

  // Fonctions pour accepter ou refuser un rendez-vous
  const handleAccept = (index: number) => {
    const updatedAppointments = [...appointmentsToday];
    updatedAppointments[index].status = 'accepted';
    setAppointmentsToday(updatedAppointments);
  };

  const handleReject = (index: number) => {
    const updatedAppointments = [...appointmentsToday];
    updatedAppointments[index].status = 'rejected';
    setAppointmentsToday(updatedAppointments);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Ajout de la section image et pseudo */}
        <View style={styles.imageWrapper}>
          <Image
            source={require('@/assets/images/pdp.png')}
            style={styles.image}
          />
          <Text style={styles.pseudo}>Valentin LAMOUCHE</Text>
        </View>
        <View style={styles.container}>
          {/* Section Aujourd'hui */}
          <View style={styles.section}>
            <View style={styles.headerContainer}>
              <Text style={styles.titre}>Aujourd’hui</Text>
            </View>
            {appointmentsToday.map((appointment, index) => (
              <View key={index} style={styles.appointmentContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">{appointment.name}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.textSecondary} numberOfLines={1} ellipsizeMode="tail">{appointment.time}</Text>
                </View>
                {appointment.status === null ? (
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.acceptButton]}
                      onPress={() => handleAccept(index)}
                    >
                      <Text style={styles.buttonText}>Accepter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.rejectButton]}
                      onPress={() => handleReject(index)}
                    >
                      <Text style={styles.buttonText}>Refuser</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.statusIcon}>
                    {appointment.status === 'accepted' ? '✔️' : '❌'}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.sectionSeparator} />

          {/* Section Hier */}
          <View style={styles.section}>
            <View style={styles.headerContainer}>
              <Text style={styles.titre}>Hier</Text>
            </View>
            {appointmentsYesterday.map((appointment, index) => (
              <View key={index} style={styles.appointmentContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">{appointment.name}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.textSecondary} numberOfLines={1} ellipsizeMode="tail">{appointment.time}</Text>
                </View>
                <Text style={styles.statusIcon}>
                  {appointment.status === 'accepted' ? '✔️' : '❌'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    paddingLeft: 33,
    paddingRight: 33,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titre: {
    color: '#000',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  appointmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    maxWidth: width * 0.4, // Limite la largeur pour éviter le débordement
  },
  text: {
    color: '#000',
    fontSize: 15,
    fontStyle: 'normal',
    fontWeight: '600',
    fontFamily: 'Inter',
    width: '100%',
  },
  textSecondary: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'normal',
    fontFamily: 'Inter',
    textAlign: 'right',
    marginRight: 12,
    width: '100%',
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    maxWidth: width * 0.4, // Limite la largeur pour éviter le débordement
  },
  textInput: {
    color: '#000',
    fontSize: 15,
    fontStyle: 'normal',
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 6,
    padding: 8,
    backgroundColor: 'transparent',
    textAlign: 'right',
    minWidth: 140,
    width: '100%',
    maxWidth: width * 0.4, // Limite la largeur pour éviter le débordement
  },
  textInputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    fontFamily: 'Inter',
    textAlign: 'right',
    marginTop: 4,
    width: '100%',
  },
  ellipsis: {
    color: '#007BFF',
    fontSize: 15,
    fontStyle: 'normal',
    fontFamily: 'Inter',
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#007BFF',
  },
  rejectButton: {
    backgroundColor: '#FF4D4D',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  statusIcon: {
    fontSize: 18,
  },
  sectionSeparator: {
    height: 30,
  },
  imageWrapper: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
});