import { supabase } from '../config/database.js';

export async function createNotification(userId, appointmentId, type, title, message) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        appointment_id: appointmentId,
        type,
        title,
        message
      }]);
    
    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}