import { supabase } from '../config/database.js';
import { createNotification } from '../utils/notifications.js';
import { sendAppointmentConfirmationEmail } from '../services/emailService.js';

// Get upcoming appointments for the current user
export async function getUpcomingAppointments(req, res) {
  try {
    const userId = req.user.sub;
    const today = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        patient:patients!appointments_patient_id_fkey(
          user_id, 
          users(first_name, last_name, phone, profile_url)
        ),
        practitioner:practitioners!appointments_practitioner_id_fkey(
          user_id,
          users(first_name, last_name, phone, profile_url),
          title,
          street_address,
          city,
          specialty
        )
      `)
      .or(`patient_id.eq.${userId},practitioner_id.eq.${userId}`)
      .gte('scheduled_at', today)
      .neq('status', 'cancelled') // Exclude cancelled appointments
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
  }
}

// Get past appointments for the current user
export async function getPastAppointments(req, res) {
  try {
    const userId = req.user.sub;
    const today = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        patient:patients!appointments_patient_id_fkey(
          user_id, 
          users(first_name, last_name, phone, profile_url)
        ),
        practitioner:practitioners!appointments_practitioner_id_fkey(
          user_id,
          users(first_name, last_name, phone, profile_url),
          title,
          street_address,
          city,
          specialty
        )
      `)
      .or(`patient_id.eq.${userId},practitioner_id.eq.${userId}`)
      .lt('scheduled_at', today)
      .neq('status', 'cancelled') // Exclude cancelled appointments
      .order('scheduled_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching past appointments:', error);
    res.status(500).json({ error: 'Failed to fetch past appointments' });
  }
}

// Create new appointment
export async function createAppointment(req, res) {
  try {
    const { practitioner_id, scheduled_at, notes } = req.body;
    const patient_id = req.user.sub;
    
    if (!practitioner_id || !scheduled_at) {
      return res.status(400).json({ error: 'Practitioner ID and scheduled time are required' });
    }
    
    // Verify that the user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can book appointments' });
    }
    
    // Check if the slot is still available
    const appointmentDate = new Date(scheduled_at);
    const startOfSlot = new Date(appointmentDate);
    const endOfSlot = new Date(appointmentDate);
    endOfSlot.setMinutes(endOfSlot.getMinutes() + 30);
    
    const { data: existingAppointments, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('practitioner_id', practitioner_id)
      .gte('scheduled_at', startOfSlot.toISOString())
      .lt('scheduled_at', endOfSlot.toISOString())
      .neq('status', 'cancelled');
    
    if (checkError) throw checkError;
    
    if (existingAppointments && existingAppointments.length > 0) {
      return res.status(409).json({ error: 'Ce créneau n\'est plus disponible' });
    }
    
    // Create the appointment
    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert([{
        patient_id,
        practitioner_id,
        scheduled_at,
        status: 'pending',
        notes: notes || null
      }])
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Get patient and practitioner info for notifications
    const { data: patient } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', patient_id)
      .single();
    
    const { data: practitioner } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', practitioner_id)
      .single();
    
    // Create notifications
    if (patient && practitioner) {
      const appointmentDateTime = new Date(scheduled_at);
      const dateStr = appointmentDateTime.toLocaleDateString('fr-FR');
      const timeStr = appointmentDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      // Notification for practitioner (new appointment request)
      await createNotification(
        practitioner_id,
        appointment.id,
        'appointment_request',
        'Nouvelle demande de rendez-vous',
        `${patient.first_name} ${patient.last_name} a demandé un rendez-vous le ${dateStr} à ${timeStr}`
      );
      
      // Notification for patient (request sent)
      await createNotification(
        patient_id,
        appointment.id,
        'appointment_request',
        'Demande envoyée',
        `Votre demande de rendez-vous avec Dr. ${practitioner.last_name} a été envoyée`
      );
    }
    
    res.json({
      success: true,
      appointment: {
        id: appointment.id,
        scheduled_at: appointment.scheduled_at,
        status: appointment.status
      },
      message: 'Demande de rendez-vous envoyée. Vous recevrez une notification une fois acceptée par le praticien.'
    });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
}

// Cancel appointment
export async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    
    // First check if the user owns this appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('patient_id, practitioner_id, scheduled_at, status')
      .eq('id', id)
      .single();
    
    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check if user is authorized to cancel
    if (appointment.patient_id !== userId && appointment.practitioner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }
    
    // Check if appointment is in the future
    if (new Date(appointment.scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past appointments' });
    }
    
    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (updateError) throw updateError;
    
    // Get user info for notifications
    const { data: patient } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', appointment.patient_id)
      .single();
    
    const { data: practitioner } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', appointment.practitioner_id)
      .single();
    
    if (patient && practitioner) {
      const appointmentDateTime = new Date(appointment.scheduled_at);
      const dateStr = appointmentDateTime.toLocaleDateString('fr-FR');
      const timeStr = appointmentDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      // Create notification for the other party
      if (userId === appointment.patient_id) {
        // Patient cancelled - notify practitioner
        await createNotification(
          appointment.practitioner_id,
          appointment.id,
          'appointment_cancelled',
          'Rendez-vous annulé',
          `${patient.first_name} ${patient.last_name} a annulé le rendez-vous du ${dateStr} à ${timeStr}`
        );
      } else {
        // Practitioner cancelled - notify patient
        await createNotification(
          appointment.patient_id,
          appointment.id,
          'appointment_cancelled',
          'Rendez-vous annulé',
          `Dr. ${practitioner.last_name} a annulé votre rendez-vous du ${dateStr} à ${timeStr}`
        );
      }
    }
    
    res.json({ success: true, message: 'Appointment cancelled successfully' });
    
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
}

// Get appointments for the authenticated doctor on a specific date
export async function getDoctorAppointments(req, res) {
  try {
    const userId = req.user.sub;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Verify user is a practitioner
    if (req.user.role !== 'practitioner') {
      return res.status(403).json({ error: 'Only practitioners can access this endpoint' });
    }

    // Find practitioner ID for the user
    const { data: practitioner, error: practitionerError } = await supabase
      .from('practitioners')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (practitionerError || !practitioner) {
      return res.status(404).json({ error: `Practitioner not found: ${practitionerError && practitionerError.message}` });
    }

    // Set date range for the specified day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch appointments for the practitioner on the specified date
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        patient:patients!appointments_patient_id_fkey(
          user_id,
          users(first_name, last_name, profile_url)
        )
      `)
      .eq('practitioner_id', practitioner.user_id)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    // Format response to match frontend expectations
    const formattedAppointments = appointments.map(appt => ({
      id: appt.id,
      scheduled_at: appt.scheduled_at,
      patient: {
        user_id: appt.patient.user_id,
        users: {
          first_name: appt.patient.users.first_name,
          last_name: appt.patient.users.last_name,
          profile_url: appt.patient.users.profile_url,
        },
      },
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: `Failed to fetch appointments: ${error && error.message}` });
  }
}

// Accept appointment (practitioner)
export async function acceptAppointment(req, res) {
  const { id } = req.params; // This is the appointment ID
  const userId = req.user.sub;
  
  try {
    // Update appointment status to scheduled
    const { data: appointment, error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'scheduled' })
      .eq('id', id)
      .eq('practitioner_id', userId)
      .eq('status', 'pending')
      .select()
      .single();
    
    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé ou déjà traité' });
    }

    // Get patient and practitioner info
    const { data: patient } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', appointment.patient_id)
      .single();
    
    const { data: practitioner } = await supabase
      .from('practitioners')
      .select(`
        users!inner(first_name, last_name),
        title,
        street_address,
        postal_code,
        city
      `)
      .eq('user_id', userId)
      .single();
    
    if (patient && practitioner) {
      const appointmentDateTime = new Date(appointment.scheduled_at);
      const dateStr = appointmentDateTime.toLocaleDateString('fr-FR');
      const timeStr = appointmentDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      // Create notification for patient
      await createNotification(
        appointment.patient_id,
        appointment.id,
        'appointment_accepted',
        'Rendez-vous confirmé',
        `Dr. ${practitioner.users.last_name} a accepté votre rendez-vous du ${dateStr} à ${timeStr}`
      );
      
      // Send email confirmation
      try {
        await sendAppointmentConfirmationEmail(patient.email, patient, practitioner, appointmentDateTime);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Rendez-vous accepté avec succès'
    });
  } catch (error) {
    console.error('Error accepting appointment:', error);
    res.status(500).json({ error: 'Failed to accept appointment' });
  }
}

// Reject appointment (practitioner)
export async function rejectAppointment(req, res) {
  const { id } = req.params; // This is the appointment ID
  const userId = req.user.sub;
  
  try {
    // Update appointment status to cancelled
    const { data: appointment, error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('practitioner_id', userId)
      .eq('status', 'pending')
      .select()
      .single();
    
    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé ou déjà traité' });
    }

    // Get patient and practitioner info
    const { data: patient } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', appointment.patient_id)
      .single();
    
    const { data: practitioner } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();
    
    if (patient && practitioner) {
      const appointmentDateTime = new Date(appointment.scheduled_at);
      const dateStr = appointmentDateTime.toLocaleDateString('fr-FR');
      const timeStr = appointmentDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      // Create notification for patient
      await createNotification(
        appointment.patient_id,
        appointment.id,
        'appointment_rejected',
        'Rendez-vous refusé',
        `Dr. ${practitioner.last_name} a refusé votre demande de rendez-vous du ${dateStr} à ${timeStr}`
      );
    }
    
    res.json({ 
      success: true,
      message: 'Rendez-vous refusé'
    });
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    res.status(500).json({ error: 'Failed to reject appointment' });
  }
}