import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../auth-context';
import config from '../../config/config';
import AppHeader from '@/components/AppHeader';

// Theme for consistent styling
const theme = {
  colors: {
    primary: '#2E4FD1',
    accent: '#E35050',
    background: '#FFFFFF',
    card: '#FAFAFA',
    border: '#EFEFF6',
    text: '#222222',
    muted: '#888888',
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  fontSizes: {
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
  },
  borderRadius: {
    small: 8,
    medium: 12,
  },
};

// Placeholder avatar component
const PatientAvatar = ({ profileUrl }: { profileUrl?: string }) => (
  <View style={styles.avatarCircle}>
    <Image
      source={profileUrl ? { uri: profileUrl } : require('@/assets/images/placeholder-doctor.jpg')}
      style={styles.avatarImg}
    />
  </View>
);

interface IconProps {
  active: boolean;
}

const IconPlanning = ({ active }: IconProps) => (
  <Text style={{ color: active ? theme.colors.primary : theme.colors.muted, fontSize: 24 }}>
    📒
  </Text>
);

const IconPatients = ({ active }: IconProps) => (
  <Text style={{ color: active ? theme.colors.primary : theme.colors.muted, fontSize: 24 }}>
    🩺
  </Text>
);

const IconProfile = ({ active }: IconProps) => (
  <Text style={{ color: active ? theme.colors.primary : theme.colors.muted, fontSize: 24 }}>
    👤
  </Text>
);

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7h to 22h
const SCREEN_WIDTH = Dimensions.get('window').width;

interface User {
  first_name: string;
  last_name: string;
  profile_url?: string;
}

interface Patient {
  user_id: string;
  users: User;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  patient: Patient;
}

export default function PlanningScreen() {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const dateStr = selectedDate.toISOString().slice(0, 10);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    if (!token) {
      setError('Vous devez être connecté pour voir les rendez-vous.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${config.API_URL}/api/appointments/doctor?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement des rendez-vous.');
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Impossible de charger les rendez-vous. Veuillez réessayer.');
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, dateStr]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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

  const appointmentsByHour = appointments.reduce(
    (acc, appt) => {
      const d = new Date(appt.scheduled_at);
      const h = d.getHours();
      acc[h] = appt;
      return acc;
    },
    {} as { [hour: number]: Appointment },
  );

  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <View style={styles.container}>
      <AppHeader />
      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity
          onPress={goToPreviousDay}
          style={styles.navButton}
          accessibilityLabel="Jour précédent"
        >
          <Text style={styles.navButtonText}>◄</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
        <TouchableOpacity
          onPress={goToNextDay}
          style={styles.navButton}
          accessibilityLabel="Jour suivant"
        >
          <Text style={styles.navButtonText}>►</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAppointments} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          <View style={styles.grid}>
            {appointments.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun rendez-vous pour ce jour.</Text>
              </View>
            )}
            {HOURS.map((hour) => {
              const appt = appointmentsByHour[hour];
              const isCurrentHour = isToday && hour === currentHour;

              return (
                <View key={hour} style={styles.row}>
                  <Text style={[styles.hour, { color: appt ? theme.colors.primary : theme.colors.muted }]}>
                    {hour}h
                  </Text>
                  <View
                    style={[
                      styles.slot,
                      appt && styles.slotBooked,
                    ]}
                  >
                    {appt ? (
                      <View style={styles.slotContent}>
                        <Text numberOfLines={1} style={styles.patientName}>
                          {appt.patient.users.first_name} {appt.patient.users.last_name}
                        </Text>
                        <PatientAvatar profileUrl={appt.patient.users.profile_url} />
                      </View>
                    ) : null}
                  </View>
                  {isCurrentHour && (
                    <View
                      style={[
                        styles.nowLine,
                        { top: (currentMinute / 60) * 48 - 1 },
                      ]}
                    >
                      <View style={styles.nowDot} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  dateText: {
    fontSize: theme.fontSizes.xlarge,
    fontWeight: '500',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  navButton: {
    padding: theme.spacing.sm,
  },
  navButtonText: {
    fontSize: theme.fontSizes.large,
    color: theme.colors.primary,
  },
  gridContainer: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  grid: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  hour: {
    width: 40,
    fontSize: theme.fontSizes.medium,
    fontWeight: '400',
    textAlign: 'right',
    marginRight: theme.spacing.sm,
  },
  slot: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  slotBooked: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.small,
    marginVertical: theme.spacing.xs,
    borderBottomWidth: 0,
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  patientName: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: theme.fontSizes.medium,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  avatarCircle: {
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
  },
  nowLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
    width: SCREEN_WIDTH - 60,
    left: 48,
    zIndex: 3,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
    position: 'absolute',
    right: -5,
    top: -4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.accent,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.small,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.medium,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.muted,
    textAlign: 'center',
  },
});