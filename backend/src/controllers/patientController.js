import { supabase } from '../config/database.js';

// Update patient profile data
export async function updatePatient(req, res) {
  try {
    const userId = req.user.sub;
    
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can update patient data' });
    }
    
    const {
      birth_date,
      weight_kg,
      allergies,
      medical_history,
      gender,
      social_security_number,
      health_insurance,
      coverage_mutuelle,
      street_address,
      postal_code,
      city,
      country
    } = req.body;
    
    // Prepare update object - only include fields that were provided
    const updateData = {};
    
    // Handle birth_date
    if (birth_date !== undefined) {
      // Validate ISO format (YYYY-MM-DD)
      if (birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
        return res.status(400).json({ error: 'Invalid birth_date format. Use YYYY-MM-DD' });
      }
      updateData.birth_date = birth_date;
    }
    
    // Handle numeric field properly
    if (weight_kg !== undefined) {
      updateData.weight_kg = weight_kg ? parseFloat(weight_kg) : null;
    }
    
    // Handle array field properly
    if (allergies !== undefined) {
      updateData.allergies = Array.isArray(allergies) ? allergies : [];
    }
    
    if (medical_history !== undefined) updateData.medical_history = medical_history;
    if (gender !== undefined) updateData.gender = gender;
    if (social_security_number !== undefined) updateData.social_security_number = social_security_number;
    if (health_insurance !== undefined) updateData.health_insurance = health_insurance;
    if (coverage_mutuelle !== undefined) updateData.coverage_mutuelle = coverage_mutuelle;
    if (street_address !== undefined) updateData.street_address = street_address;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    
    // Validate gender if provided
    if (gender && !['M', 'F', 'Other'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }
    
    // Check if social security number is already taken by another patient
    if (social_security_number) {
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('user_id')
        .eq('social_security_number', social_security_number)
        .neq('user_id', userId)
        .single();
      
      if (existingPatient) {
        return res.status(409).json({ error: 'Ce numéro de sécurité sociale est déjà utilisé' });
      }
    }
    
    // Update patient data
    const { data: updatedPatient, error: updateError } = await supabase
      .from('patients')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating patient:', updateError);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
    
    res.json({
      success: true,
      patient: updatedPatient
    });
    
  } catch (error) {
    console.error('Error in /api/patients/update:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

// Get patient medical history
export async function getPatientMedicalHistory(req, res) {
  try {
    const userId = req.user.sub;
    
    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can access patient data' });
    }
    
    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        birth_date,
        weight_kg,
        allergies,
        medical_history,
        gender,
        social_security_number,
        health_insurance,
        coverage_mutuelle,
        street_address,
        postal_code,
        city,
        country
      `)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching patient data:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des données' });
    }
    
    res.json(patient);
    
  } catch (error) {
    console.error('Error in /api/patients/medical-history:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}