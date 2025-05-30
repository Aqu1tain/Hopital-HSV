import { supabase } from '../config/database.js';

// Recherche de praticiens avec filtrage par localisation
export async function getPractitioners(req, res) {
  try {
    const { city, postal_code } = req.query;

    let query = supabase
      .from('practitioners')
      .select(`
        user_id,
        title,
        specialty,
        street_address,
        postal_code,
        city,
        floor,
        building_code,
        public_transport_access,
        payment_card,
        payment_bank_transfer,
        payment_cheque,
        payment_cash,
        accepts_mutuelle,
        conventioned,
        standard_price_cents,
        secu_coverage_percent,
        is_verified,
        users!inner(
          first_name,
          last_name,
          email,
          phone,
          profile_url,
          created_at
        )
      `);

    // Appliquer le filtre de localisation si fourni
    if (city || postal_code) {
      let orFilters = [];
      if (city) {
        orFilters.push(`city.ilike.%${city}%`);
      }
      if (postal_code) {
        orFilters.push(`postal_code.ilike.%${postal_code}%`);
      }
      if (orFilters.length > 0) {
        query = query.or(orFilters.join(","));
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const formattedData = data.map(practitioner => ({
      id: practitioner.user_id,
      name: `${practitioner.users.first_name} ${practitioner.users.last_name}`,
      title: practitioner.title,
      specialty: practitioner.specialty,
      address: [
        practitioner.street_address,
        practitioner.postal_code,
        practitioner.city
      ].filter(Boolean).join(', '),
      image: practitioner.users.profile_url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png',
      // Champs additionnels pour /api/practitioners
      floor: practitioner.floor,
      buildingCode: practitioner.building_code,
      transportAccess: practitioner.public_transport_access,
      accepts_mutuelle: practitioner.accepts_mutuelle || false,
      conventioned: practitioner.conventioned || false,
      isVerified: practitioner.is_verified || false,
      price: practitioner.standard_price_cents ? {
        amount: practitioner.standard_price_cents / 100,
        currency: 'EUR',
        secuCoverage: practitioner.secu_coverage_percent || 0
      } : null,
      payment_methods: {
        card: practitioner.payment_card || false,
        bank_transfer: practitioner.payment_bank_transfer || false,
        check: practitioner.payment_cheque || false,
        cash: practitioner.payment_cash || false
      },
      email: practitioner.users.email,
      phone: practitioner.users.phone,
      createdAt: practitioner.users.created_at
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching practitioner appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}

// Update practitioner profile data
export async function updatePractitioner(req, res) {
  try {
    const userId = req.user.sub;
    
    // Verify user is a practitioner
    if (req.user.role !== 'practitioner') {
      return res.status(403).json({ error: 'Only practitioners can update practitioner data' });
    }
    
    const updateData = req.body;
    
    // Update practitioner data
    const { data: updatedPractitioner, error: updateError } = await supabase
      .from('practitioners')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();
    
      if (updateError) {
        console.error('Error updating practitioner:', updateError);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
      }
      
      res.json({
        success: true,
        practitioner: updatedPractitioner
      }); 
  } catch (error) {
    console.error('Error in /api/practitioners/update:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

// Get available practitioners for today
export async function getAvailablePractitioners(req, res) {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    
    // Get practitioners who are available today
    const { data: availablePractitioners, error: availabilityError } = await supabase
      .from('practitioner_availabilities')
      .select(`
        practitioner_id,
        start_time,
        end_time,
        practitioners!inner(
          user_id,
          title,
          specialty,
          street_address,
          postal_code,
          city,
          floor,
          building_code,
          public_transport_access,
          payment_card,
          payment_bank_transfer,
          payment_cheque,
          payment_cash,
          accepts_mutuelle,
          conventioned,
          standard_price_cents,
          secu_coverage_percent,
          is_verified,
          users!inner(
            first_name,
            last_name,
            email,
            phone,
            profile_url,
            created_at
          )
        )
      `)
      .eq('weekday', dayOfWeek)
      .order('start_time', { ascending: true });

    if (availabilityError) throw availabilityError;
    
    // Filter out duplicates and format the response with the same structure
    const uniquePractitioners = [];
    const seenIds = new Set();
    
    availablePractitioners.forEach(p => {
      if (!seenIds.has(p.practitioner_id)) {
        seenIds.add(p.practitioner_id);
        const practitioner = p.practitioners;
        
        uniquePractitioners.push({
          id: practitioner.user_id,
          name: `${practitioner.users.first_name} ${practitioner.users.last_name}`,
          title: practitioner.title || 'Dr.',
          specialty: practitioner.specialty || 'Médecin Généraliste',
          address: [
            practitioner.street_address,
            practitioner.postal_code,
            practitioner.city
          ].filter(Boolean).join(', '),
          image: practitioner.users.profile_url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png',
          // Champs additionnels harmonisés
          floor: practitioner.floor,
          buildingCode: practitioner.building_code,
          transportAccess: practitioner.public_transport_access,
          accepts_mutuelle: practitioner.accepts_mutuelle || false,
          conventioned: practitioner.conventioned || false,
          isVerified: practitioner.is_verified || false,
          price: practitioner.standard_price_cents ? {
            amount: practitioner.standard_price_cents / 100,
            currency: 'EUR',
            secuCoverage: practitioner.secu_coverage_percent || 0
          } : null,
          payment_methods: {
            card: practitioner.payment_card || false,
            bank_transfer: practitioner.payment_bank_transfer || false,
            check: practitioner.payment_cheque || false,
            cash: practitioner.payment_cash || false
          },
          email: practitioner.users.email,
          phone: practitioner.users.phone,
          createdAt: practitioner.users.created_at
        });
      }
    });
    
    res.json(uniquePractitioners);
  } catch (error) {
    console.error('Error fetching available practitioners:', error);
    res.status(500).json({ error: 'Failed to fetch available practitioners' });
  }
}

// Get practitioner availability for a specific date
export async function getPractitionerAvailability(req, res) {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();
    
    // Get practitioner's availability for the specified day
    const { data: availabilities, error: availError } = await supabase
      .from('practitioner_availabilities')
      .select('*')
      .eq('practitioner_id', id)
      .eq('weekday', dayOfWeek);
    
    if (availError) throw availError;
    
    if (!availabilities || availabilities.length === 0) {
      return res.json({ available: false, timeSlots: [] });
    }
    
    // Get existing appointments for this practitioner on this date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('scheduled_at')
      .eq('practitioner_id', id)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .neq('status', 'cancelled');
    
    if (apptError) throw apptError;
    
    // Generate time slots
    const timeSlots = [];
    const slotDuration = 30; // 30 minutes per slot
    
    availabilities.forEach(availability => {
      const [startHour, startMinute] = availability.start_time.split(':').map(Number);
      const [endHour, endMinute] = availability.end_time.split(':').map(Number);
      
      let currentTime = new Date(requestedDate);
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(requestedDate);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      while (currentTime < endTime) {
        const slotTime = new Date(currentTime);
        
        // Check if this slot is already booked
        const isBooked = appointments.some(appt => {
          const apptTime = new Date(appt.scheduled_at);
          return apptTime.getTime() === slotTime.getTime();
        });
        
        // Only add future slots
        if (slotTime > new Date()) {
          timeSlots.push({
            time: slotTime.toTimeString().slice(0, 5),
            datetime: slotTime.toISOString(),
            available: !isBooked
          });
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      }
    });
    
    res.json({
      available: true,
      timeSlots: timeSlots.sort((a, b) => a.datetime.localeCompare(b.datetime))
    });
    
  } catch (error) {
    console.error('Error fetching practitioner availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
}

// Get appointments for a specific practitioner and date range
export async function getPractitionerAppointments(req, res) {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        patient:patients!appointments_patient_id_fkey(
          user_id,
          users(first_name, last_name)
        )
      `)
      .eq('practitioner_id', id)
      .gte('scheduled_at', start_date)
      .lte('scheduled_at', end_date)
      .order('scheduled_at', { ascending: true });
    
    if (error) throw error;
    
    res.json(appointments);
    
  } catch (error) {
    console.error('Error fetching practitioner appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}