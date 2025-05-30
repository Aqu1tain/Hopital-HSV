import { supabase } from '../config/database.js';
import { createNotification } from '../utils/notifications.js';

// Get notifications for patients
export async function getPatientNotifications(req, res) {
  const userId = req.user.sub;
  
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        appointment:appointments(
          scheduled_at,
          status,
          practitioner:practitioners(
            user:users(first_name, last_name, profile_url)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Transform notifications for display
    const formattedNotifications = notifications.map(notif => {
      const createdDate = new Date(notif.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let section = '';
      if (createdDate.toDateString() === today.toDateString()) {
        section = "Aujourd'hui";
      } else if (createdDate.toDateString() === yesterday.toDateString()) {
        section = 'Hier';
      } else {
        section = createdDate.toLocaleDateString('fr-FR');
      }

      return {
        id: notif.id,
        section,
        time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        title: notif.title,
        message: notif.message,
        type: notif.type,
        appointment_id: notif.appointment_id,
        is_read: notif.is_read,
        created_at: notif.created_at,
        cancellable: notif.type === 'appointment_request' || 
                    (notif.type === 'appointment_accepted' && 
                     notif.appointment?.status === 'scheduled' &&
                     new Date(notif.appointment.scheduled_at) > new Date())
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching patient notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

// Get notifications for practitioners
export async function getPractitionerNotifications(req, res) {
  const userId = req.user.sub;
  
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        appointment:appointments(
          scheduled_at,
          status,
          patient:patients(
            user:users(first_name, last_name, profile_url)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Transform notifications for display
    const formattedNotifications = notifications.map(notif => {
      const createdDate = new Date(notif.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let section = '';
      if (createdDate.toDateString() === today.toDateString()) {
        section = "Aujourd'hui";
      } else if (createdDate.toDateString() === yesterday.toDateString()) {
        section = 'Hier';
      } else {
        section = createdDate.toLocaleDateString('fr-FR');
      }

      const patient = notif.appointment?.patient;
      const patientName = patient ? `${patient.user.first_name} ${patient.user.last_name}` : 'Patient';

      return {
        id: notif.id,
        appointment_id: notif.appointment_id,
        section,
        time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        title: notif.title,
        message: notif.message,
        type: notif.type,
        is_read: notif.is_read,
        created_at: notif.created_at,
        patientName,
        patientAvatar: patient?.user.profile_url,
        status: notif.appointment?.status || 'unknown',
        scheduledAt: notif.appointment?.scheduled_at
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching practitioner notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

// Get notification count
export async function getNotificationCount(req, res) {
  const userId = req.user.sub;
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    
    res.json({ count: data ? data.length : 0 });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
}

// Cancel appointment notification
export async function cancelNotification(req, res) {
  const { id } = req.params;
  const userId = req.user.sub;
  
  try {
    // Verify the appointment belongs to the user and is cancellable
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('patient_id, practitioner_id, scheduled_at, status')
      .eq('id', id)
      .single();
    
    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check if user owns this appointment
    if (appointment.patient_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }
    
    // Check if appointment is in the future and cancellable
    if (new Date(appointment.scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past appointments' });
    }
    
    if (!['pending', 'scheduled'].includes(appointment.status)) {
      return res.status(400).json({ error: 'Appointment cannot be cancelled' });
    }
    
    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
}

export async function cancelAppointmentFromNotification(req, res) {
  const { id } = req.params; // This is the notification ID
  const userId = req.user.sub;
  
  try {
    // Get the notification and associated appointment
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('appointment_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (notifError || !notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (!notification.appointment_id) {
      return res.status(400).json({ error: 'No appointment associated with this notification' });
    }
    
    // Cancel the appointment using the existing cancel logic
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('patient_id, practitioner_id, scheduled_at, status')
      .eq('id', notification.appointment_id)
      .single();
    
    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check authorization and validity
    if (appointment.patient_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }
    
    if (new Date(appointment.scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past appointments' });
    }
    
    if (!['pending', 'scheduled'].includes(appointment.status)) {
      return res.status(400).json({ error: 'Appointment cannot be cancelled' });
    }
    
    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', notification.appointment_id);
    
    if (updateError) throw updateError;
    
    // Create cancellation notification for practitioner
    const { data: patient } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', appointment.patient_id)
      .single();
    
    if (patient) {
      const appointmentDateTime = new Date(appointment.scheduled_at);
      const dateStr = appointmentDateTime.toLocaleDateString('fr-FR');
      const timeStr = appointmentDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      await createNotification(
        appointment.practitioner_id,
        notification.appointment_id,
        'appointment_cancelled',
        'Rendez-vous annulé',
        `${patient.first_name} ${patient.last_name} a annulé le rendez-vous du ${dateStr} à ${timeStr}`
      );
    }
    
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment from notification:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead(req, res) {
  const userId = req.user.sub;
  
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
}

export async function markNotificationRead(req, res) {
  const { id } = req.params;
  const userId = req.user.sub;
  
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}