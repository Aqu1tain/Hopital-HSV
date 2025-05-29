import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity, // Ajout pour les boutons
} from 'react-native';
import { useAuth } from '../auth-context';
import config from '../../config/config';
import AppHeader from '@/components/AppHeader';

// Icônes d’avatar, planning, patients, profil : à remplacer par les tiens ou ceux d’un lib.
const PatientAvatar = () => (
  <View style={styles.avatarCircle}>
    <Image source={require('@/assets/images/placeholder-doctor.jpg')} style={styles.avatarImg} />
  </View>
);

interface IconProps {
  active: boolean;
}

const IconPlanning = ({ active }: IconProps) => (
  <Text style={{ color: active ? "#2E4FD1" : "#888", fontSize: 24 }}>📒</Text>
);

const IconPatients = ({ active }: IconProps) => (
  <Text style={{ color: active ? "#2E4FD1" : "#888", fontSize: 24 }}>🩺</Text>
);

const IconProfile = ({ active }: IconProps) => (
  <Text style={{ color: active ? "#2E4FD1" : "#888", fontSize: 24 }}>👤</Text>
);

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7h à 22h
const SCREEN_WIDTH = Dimensions.get('window').width;

interface Appointment {
  id: string;
  scheduled_at: string;
  patient: {
    user_id: string;
    users: {
      first_name: string;
      last_name: string;
      profile_url?: string;
    };
  };
}

export default function PlanningScreen() {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date()); // État pour la date sélectionnée

  // Format de la date pour l'API (YYYY-MM-DD)
  const dateStr = selectedDate.toISOString().slice(0, 10);

  // Fonctions pour naviguer entre les jours
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    setSelectedDate(nextDay);
  };

  // Charger les rendez-vous pour la date sélectionnée
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${config.API_URL}/api/appointments/doctor?date=${dateStr}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        setAppointments(data || []);
      } catch {
        setAppointments([]);
      }
      setLoading(false);
    })();
  }, [token, dateStr]); // Dépendance sur dateStr pour recharger à chaque changement de date

    const appointmentsByHour = Array.isArray(appointments)
          ? appointments.reduce((acc, appt) => {
              const d = new Date(appt.scheduled_at);
              const h = d.getHours();
              acc[h] = appt;
              return acc;
            }, {} as { [hour: number]: Appointment })
          : {};

  // Ligne rouge "heure actuelle" (seulement si c'est aujourd'hui)
  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <AppHeader />
      {/* Barre de navigation des jours */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={goToPreviousDay} style={styles.navButton}>
          <Text style={styles.navButtonText}>◄</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <TouchableOpacity onPress={goToNextDay} style={styles.navButton}>
          <Text style={styles.navButtonText}>►</Text>
        </TouchableOpacity>
      </View>
      {/* Grille planning */}
      <View style={styles.gridContainer}>
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          <View style={styles.grid}>
            {HOURS.map((hour, i) => {
              const appt = appointmentsByHour[hour];
              // Pour la ligne de l'heure actuelle (seulement si c'est aujourd'hui)
              const isCurrentHour = isToday && hour === currentHour;
              return (
                <View key={hour} style={styles.row}>
                  {/* Heure (gauche) */}
                  <Text style={[styles.hour, { color: appt ? '#fff' : '#aaa' }]}>
                    {hour}h
                  </Text>
                  {/* Slot rendez-vous */}
                  <View style={[
                    styles.slot,
                    appt && styles.slotBooked,
                    appt && { borderBottomWidth: 0 },
                  ]}>
                    {appt ? (
                      <View style={styles.slotContent}>
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={styles.patientName}>
                            {appt.patient.users.first_name} {appt.patient.users.last_name}
                          </Text>
                        </View>
                        <PatientAvatar />
                      </View>
                    ) : null}
                  </View>
                  {/* Ligne rouge heure courante */}
                  {isCurrentHour && (
                    <View style={{
                      ...styles.nowLine,
                      left: 40,
                      width: SCREEN_WIDTH - 60,
                      top: (currentMinute / 60) * 48 - 1,
                    }}>
                      <View style={styles.nowDot} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  grid: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFF6',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: 1,
    borderColor: '#EFEFF6',
    backgroundColor: '#fff',
    position: 'relative',
  },
  hour: {
    width: 36,
    fontSize: 16,
    fontWeight: '400',
    color: '#bbb',
    textAlign: 'right',
    marginRight: 4,
  },
  slot: {
    flex: 1,
    minHeight: 48,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderColor: '#EFEFF6',
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 18,
  },
  slotBooked: {
    backgroundColor: '#436DE2',
    borderRadius: 7,
    marginVertical: 3,
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  patientName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 6,
  },
  avatarCircle: {
    backgroundColor: '#fff9',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    borderWidth: 1,
    borderColor: '#e1e6f9',
  },
  avatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f2f4',
  },
  nowLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#E35050',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E35050',
    position: 'absolute',
    right: -6,
    top: -4,
  },
  // Styles pour la navigation des jours
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 19,
    fontWeight: '500',
    color: '#222',
    textTransform: 'capitalize',
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    fontSize: 20,
    color: '#2E4FD1',
  },
});