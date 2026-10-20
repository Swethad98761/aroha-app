// src/data/yogaData.ts
// Based on Hatha Yoga Pradipika, Gheranda Samhita, Shiva Samhita, and Puranic traditions

export interface YogaMudra {
  id: string;
  name: string;         // English
  sanskrit: string;     // Sanskrit
  type: 'asana' | 'pranayama' | 'mudra' | 'bandha' | 'kriya';
  form: string;         // Which yoga form it belongs to
  duration: number;     // recommended seconds
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  benefits: string[];
  chakra: string;
  bodyParts: string[];
  instructions: string[];
  caution?: string;
  purana?: string;      // Scriptural reference
}

export interface YogaForm {
  id: string;
  name: string;
  sanskrit: string;
  emoji: string;
  description: string;
  origin: string;       // Which scripture/tradition
  duration: string;     // recommended total duration
  benefits: string[];
  mudras: string[];     // mudra IDs
}

export const YOGA_MUDRAS: YogaMudra[] = [
  // ── SURYA NAMASKAR SEQUENCE ────────────────────────────────────
  {
    id: 'pranamasana', name: 'Prayer Pose', sanskrit: 'Pranamasana (प्रणामासन)',
    type: 'asana', form: 'surya_namaskar', duration: 30, difficulty: 'beginner',
    benefits: ['Centers the mind', 'Activates Anahata chakra', 'Prepares body for practice'],
    chakra: 'Anahata (Heart)', bodyParts: ['Chest', 'Shoulders'],
    instructions: ['Stand at edge of mat', 'Bring palms together at chest', 'Exhale, find stillness', 'Set your Sankalpam (intention)'],
    purana: 'Mentioned in Rig Veda as Surya worship posture',
  },
  {
    id: 'hastauttanasana', name: 'Raised Arms Pose', sanskrit: 'Hastauttanasana (हस्तउत्तानासन)',
    type: 'asana', form: 'surya_namaskar', duration: 20, difficulty: 'beginner',
    benefits: ['Opens chest and lungs', 'Stretches spine', 'Stimulates digestive system'],
    chakra: 'Vishuddha (Throat)', bodyParts: ['Shoulders', 'Abs', 'Back'],
    instructions: ['Inhale, sweep arms overhead', 'Arch back gently', 'Keep biceps by ears', 'Gaze toward thumbs'],
    purana: 'Surya Namaskar sequence, Ashtanga tradition',
  },
  {
    id: 'padahastasana', name: 'Hand to Foot Pose', sanskrit: 'Padahastasana (पादहस्तासन)',
    type: 'asana', form: 'surya_namaskar', duration: 20, difficulty: 'beginner',
    benefits: ['Stretches hamstrings', 'Improves digestion', 'Calms nervous system'],
    chakra: 'Swadhisthana (Sacral)', bodyParts: ['Hamstrings', 'Back', 'Calves'],
    instructions: ['Exhale, fold forward from hips', 'Touch fingertips to floor or shins', 'Relax head and neck', 'Press heels firmly'],
    purana: 'Hatha Yoga Pradipika, Chapter 1',
  },
  {
    id: 'ashwa_sanchalanasana', name: 'Equestrian Pose', sanskrit: 'Ashwa Sanchalanasana (अश्वसञ्चालनासन)',
    type: 'asana', form: 'surya_namaskar', duration: 20, difficulty: 'beginner',
    benefits: ['Strengthens legs', 'Opens hip flexors', 'Builds courage (Ashwa = horse)'],
    chakra: 'Muladhara (Root)', bodyParts: ['Quads', 'Hamstrings', 'Glutes'],
    instructions: ['Inhale, step right leg back', 'Lower right knee to mat', 'Look forward with lion gaze', 'Fingertips on floor sides of left foot'],
    purana: 'Named after the horse (Ashwa) of Surya\'s chariot in Puranas',
  },
  {
    id: 'dandasana', name: 'Staff / Plank Pose', sanskrit: 'Dandasana (दण्डासन)',
    type: 'asana', form: 'surya_namaskar', duration: 30, difficulty: 'beginner',
    benefits: ['Core strength', 'Arm strength', 'Mental fortitude'],
    chakra: 'Manipura (Solar Plexus)', bodyParts: ['Abs', 'Chest', 'Shoulders', 'Triceps'],
    instructions: ['Hold breath, step left foot back', 'Body in straight line', 'Shoulders over wrists', 'Engage core like Vajra (thunderbolt)'],
    purana: 'Danda = staff of Yama (god of dharma) — symbol of discipline',
  },
  {
    id: 'ashtanga_namaskar', name: 'Eight Limb Salute', sanskrit: 'Ashtanga Namaskar (अष्टांग नमस्कार)',
    type: 'asana', form: 'surya_namaskar', duration: 15, difficulty: 'beginner',
    benefits: ['Strengthens chest and arms', 'Spine flexibility'],
    chakra: 'Anahata (Heart)', bodyParts: ['Chest', 'Triceps', 'Abs'],
    instructions: ['Exhale, lower knees, chest, chin to floor', 'Eight points touch: toes, knees, hands, chest, chin', 'Hips slightly raised', 'Elbows close to body'],
    purana: 'Ashtanga = eight limbs, referenced in Patanjali Yoga Sutras',
  },
  {
    id: 'bhujangasana', name: 'Cobra Pose', sanskrit: 'Bhujangasana (भुजंगासन)',
    type: 'asana', form: 'surya_namaskar', duration: 20, difficulty: 'beginner',
    benefits: ['Strengthens spine', 'Opens heart', 'Stimulates Kundalini energy'],
    chakra: 'Anahata (Heart)', bodyParts: ['Spine', 'Chest', 'Shoulders'],
    instructions: ['Inhale, press hands, lift chest', 'Elbows slightly bent', 'Shoulders away from ears', 'Gaze upward like a cobra rising'],
    purana: 'Bhujanga = serpent, symbolizes Kundalini shakti (Tantra texts)',
    caution: 'Avoid if lower back injury',
  },
  {
    id: 'adho_mukha', name: 'Downward Dog', sanskrit: 'Adho Mukha Svanasana (अधोमुखश्वानासन)',
    type: 'asana', form: 'surya_namaskar', duration: 30, difficulty: 'beginner',
    benefits: ['Full body stretch', 'Calms mind', 'Builds arm strength'],
    chakra: 'Sahasrara (Crown)', bodyParts: ['Hamstrings', 'Shoulders', 'Back', 'Calves'],
    instructions: ['Exhale, tuck toes, lift hips', 'Form inverted V shape', 'Press heels toward floor', 'Head between arms, gaze navel'],
    purana: 'Svana = dog — the devoted animal of Bhairava (form of Shiva)',
  },

  // ── HATHA YOGA ASANAS ─────────────────────────────────────────
  {
    id: 'vrikshasana', name: 'Tree Pose', sanskrit: 'Vrikshasana (वृक्षासन)',
    type: 'asana', form: 'hatha', duration: 60, difficulty: 'beginner',
    benefits: ['Balance and focus', 'Strengthens legs', 'Calms Vata dosha'],
    chakra: 'Muladhara (Root)', bodyParts: ['Quads', 'Calves', 'Abs'],
    instructions: ['Stand on one leg', 'Place sole of other foot on inner thigh', 'Bring palms together overhead', 'Focus on a fixed point (Trataka)'],
    purana: 'Vriksha = tree of life, symbol of Ashvattha (sacred fig tree) in Bhagavad Gita',
  },
  {
    id: 'trikonasana', name: 'Triangle Pose', sanskrit: 'Trikonasana (त्रिकोणासन)',
    type: 'asana', form: 'hatha', duration: 45, difficulty: 'beginner',
    benefits: ['Stretches sides and hamstrings', 'Stimulates Manipura', 'Improves digestion'],
    chakra: 'Manipura (Solar Plexus)', bodyParts: ['Hamstrings', 'Shoulders', 'Abs'],
    instructions: ['Wide stance, arms parallel to floor', 'Reach toward front ankle', 'Other arm stretches skyward', 'Gaze at upper hand — the triangle mirrors Trikona Yantra'],
    purana: 'Trikona = triangle, sacred geometry of Devi (Sri Yantra)',
  },
  {
    id: 'virabhadrasana1', name: 'Warrior I', sanskrit: 'Virabhadrasana I (वीरभद्रासन)',
    type: 'asana', form: 'hatha', duration: 45, difficulty: 'beginner',
    benefits: ['Builds strength and stamina', 'Opens chest', 'Builds warrior spirit'],
    chakra: 'Manipura (Solar Plexus)', bodyParts: ['Quads', 'Glutes', 'Shoulders'],
    instructions: ['Step one foot back, angle 45°', 'Bend front knee over ankle', 'Raise arms overhead', 'Channel Virabhadra — warrior born from Shiva\'s matted hair'],
    purana: 'Named for Virabhadra, the fierce warrior created by Shiva (Shiva Purana)',
  },
  {
    id: 'virabhadrasana2', name: 'Warrior II', sanskrit: 'Virabhadrasana II (वीरभद्रासन II)',
    type: 'asana', form: 'hatha', duration: 45, difficulty: 'beginner',
    benefits: ['Strengthens legs and core', 'Opens hips', 'Builds endurance'],
    chakra: 'Svadhisthana (Sacral)', bodyParts: ['Quads', 'Glutes', 'Shoulders', 'Abs'],
    instructions: ['Wide stance', 'Arms extend parallel to floor', 'Bend front knee, gaze over front hand', 'Hold like Virabhadra drawing his bow'],
    purana: 'Virabhadra slaying Daksha — Shiva Purana, Rudra Samhita',
  },
  {
    id: 'setu_bandha', name: 'Bridge Pose', sanskrit: 'Setu Bandhasana (सेतुबन्धासन)',
    type: 'asana', form: 'hatha', duration: 45, difficulty: 'beginner',
    benefits: ['Strengthens glutes and spine', 'Chest opener', 'Calms anxiety'],
    chakra: 'Anahata (Heart)', bodyParts: ['Glutes', 'Hamstrings', 'Spine'],
    instructions: ['Lie on back, knees bent', 'Press feet and lift hips', 'Clasp hands under back', 'Setu = bridge connecting earth and heaven'],
    purana: 'Setu = Rama\'s bridge to Lanka (Ramayana, Valmiki)',
  },
  {
    id: 'paschimottanasana', name: 'Seated Forward Bend', sanskrit: 'Paschimottanasana (पश्चिमोत्तानासन)',
    type: 'asana', form: 'hatha', duration: 60, difficulty: 'beginner',
    benefits: ['Stretches spine and hamstrings', 'Calms mind', 'Stimulates digestive fire'],
    chakra: 'Swadhisthana (Sacral)', bodyParts: ['Hamstrings', 'Back', 'Calves'],
    instructions: ['Sit with legs extended', 'Inhale lengthen spine', 'Exhale, hinge forward from hips', 'Hold feet or shins, breathe into stretch'],
    purana: 'Hatha Yoga Pradipika 1.28 — "destroys all diseases"',
  },
  {
    id: 'matsyasana', name: 'Fish Pose', sanskrit: 'Matsyasana (मत्स्यासन)',
    type: 'asana', form: 'hatha', duration: 30, difficulty: 'beginner',
    benefits: ['Opens throat and chest', 'Stimulates thyroid', 'Counterpose to shoulder stand'],
    chakra: 'Vishuddha (Throat)', bodyParts: ['Chest', 'Shoulders', 'Back'],
    instructions: ['Lie on back', 'Arch upper back, crown of head to floor', 'Hands under hips or in prayer', 'Named for Matsya Avatar of Vishnu'],
    purana: 'Matsya = Vishnu\'s fish avatar, first of Dashavatara (Bhagavata Purana)',
  },
  {
    id: 'kurmasana', name: 'Tortoise Pose', sanskrit: 'Kurmasana (कूर्मासन)',
    type: 'asana', form: 'hatha', duration: 60, difficulty: 'advanced',
    benefits: ['Deep hip opener', 'Withdrawal of senses (Pratyahara)', 'Profound stillness'],
    chakra: 'Ajna (Third Eye)', bodyParts: ['Hips', 'Hamstrings', 'Back'],
    instructions: ['Sit, legs wide', 'Slide arms under bent knees', 'Fold forward deeply', 'Withdraw inward like a tortoise into its shell'],
    purana: 'Kurma = Vishnu\'s tortoise avatar, churning Amrita (Bhagavata Purana 8.7)',
  },
  {
    id: 'natarajasana', name: 'Dancer\'s Pose', sanskrit: 'Natarajasana (नटराजासन)',
    type: 'asana', form: 'hatha', duration: 45, difficulty: 'advanced',
    benefits: ['Balance and grace', 'Opens chest and shoulders', 'Connects to cosmic dance'],
    chakra: 'Ajna (Third Eye)', bodyParts: ['Quads', 'Shoulders', 'Abs', 'Calves'],
    instructions: ['Balance on one foot', 'Lift back foot, reach back to hold', 'Extend other arm forward', 'Embody Shiva Nataraja — the cosmic dancer'],
    purana: 'Nataraja = Shiva\'s dance of creation and destruction (Chidambaram Mahatmya)',
  },
  {
    id: 'savasana', name: 'Corpse Pose', sanskrit: 'Savasana (शवासन)',
    type: 'asana', form: 'hatha', duration: 300, difficulty: 'beginner',
    benefits: ['Complete body relaxation', 'Integrates practice', 'Prepares for Yoga Nidra'],
    chakra: 'Sahasrara (Crown)', bodyParts: ['Full Body'],
    instructions: ['Lie flat, arms slightly away from body', 'Feet fall naturally apart', 'Close eyes, release all effort', 'Be like Shava — the inert, pure awareness'],
    purana: 'Shava = corpse; Kali stands on Shiva as Shava — symbol of pure consciousness (Tantras)',
  },

  // ── PRANAYAMA ─────────────────────────────────────────────────
  {
    id: 'nadi_shodhana', name: 'Alternate Nostril Breathing', sanskrit: 'Nadi Shodhana (नाडी शोधन)',
    type: 'pranayama', form: 'pranayama', duration: 300, difficulty: 'beginner',
    benefits: ['Purifies 72,000 nadis', 'Balances left/right brain', 'Reduces anxiety', 'Balances Ida and Pingala'],
    chakra: 'Ajna (Third Eye)', bodyParts: ['Full Body'],
    instructions: [
      'Sit in Sukhasana or Padmasana',
      'Vishnu Mudra: fold index and middle finger',
      'Close right nostril with thumb, inhale left (4 counts)',
      'Close both, hold (16 counts)',
      'Open right, exhale right (8 counts)',
      'Inhale right, hold both, exhale left',
      'This is one round — do 5 to 20',
    ],
    purana: 'Hatha Yoga Pradipika 2.7-10: "Nadi Shodhana destroys all diseases"',
  },
  {
    id: 'kapalabhati', name: 'Skull Shining Breath', sanskrit: 'Kapalabhati (कपालभाति)',
    type: 'pranayama', form: 'pranayama', duration: 180, difficulty: 'intermediate',
    benefits: ['Cleanses lungs', 'Awakens Kundalini', 'Stimulates Agni (digestive fire)', 'Energizes mind'],
    chakra: 'Manipura (Solar Plexus)', bodyParts: ['Abs', 'Full Body'],
    instructions: [
      'Sit comfortably, spine erect',
      'Passive inhale through nose',
      'Sharp, forceful exhale through nose (contract belly)',
      'Start: 30 pumps per round',
      'Rest, observe internal stillness',
      'Build up to 3 rounds of 108',
    ],
    purana: 'Hatha Yoga Pradipika 2.35: "makes the face brilliant"',
    caution: 'Avoid during pregnancy, hypertension, or heart conditions',
  },
  {
    id: 'bhramari', name: 'Humming Bee Breath', sanskrit: 'Bhramari (भ्रामरी)',
    type: 'pranayama', form: 'pranayama', duration: 180, difficulty: 'beginner',
    benefits: ['Instantly calms mind', 'Reduces anger and anxiety', 'Activates vagus nerve', 'Simulates Om vibration'],
    chakra: 'Ajna (Third Eye)', bodyParts: ['Full Body'],
    instructions: [
      'Sit in meditation posture',
      'Shanmukhi Mudra: close eyes, ears, nostrils lightly with fingers',
      'Inhale deeply',
      'Exhale making a steady humming sound like a bee',
      'Feel the vibration inside skull',
      'Repeat 5-10 times',
    ],
    purana: 'Hatha Yoga Pradipika 2.68: destroys fatigue of the mind',
  },
  {
    id: 'ujjayi', name: 'Victorious Breath', sanskrit: 'Ujjayi (उज्जायी)',
    type: 'pranayama', form: 'pranayama', duration: 300, difficulty: 'beginner',
    benefits: ['Builds internal heat', 'Deepens concentration', 'Clears Pranamaya Kosha'],
    chakra: 'Vishuddha (Throat)', bodyParts: ['Full Body'],
    instructions: [
      'Constrict back of throat slightly',
      'Breathe through nose with soft ocean sound',
      'Like sound of the sea in a conch shell',
      'Equal inhale and exhale: 4-6 counts each',
      'Use throughout Vinyasa practice',
    ],
    purana: 'Hatha Yoga Pradipika 2.51-53',
  },
  {
    id: 'bhastrika', name: 'Bellows Breath', sanskrit: 'Bhastrika (भस्त्रिका)',
    type: 'pranayama', form: 'pranayama', duration: 120, difficulty: 'intermediate',
    benefits: ['Ignites Agni fire', 'Awakens Kundalini', 'Purifies blood', 'Generates heat'],
    chakra: 'Manipura (Solar Plexus)', bodyParts: ['Abs', 'Chest'],
    instructions: [
      'Sit in Vajrasana or Padmasana',
      'Both inhalation AND exhalation are forceful',
      'Like blacksmith\'s bellows (Bhastra)',
      'Start slow: 10 breaths per round',
      'Rest and observe',
      'Build to 3 rounds of 30',
    ],
    purana: 'Hatha Yoga Pradipika 2.59: "destroys all diseases caused by phlegm"',
    caution: 'Do not practice if pregnant or with heart conditions',
  },

  // ── MUDRAS ────────────────────────────────────────────────────
  {
    id: 'chin_mudra', name: 'Consciousness Gesture', sanskrit: 'Chin Mudra (चिन्मुद्रा)',
    type: 'mudra', form: 'mudra', duration: 300, difficulty: 'beginner',
    benefits: ['Connects individual consciousness to universal', 'Improves focus', 'Reduces anxiety'],
    chakra: 'Ajna (Third Eye)', bodyParts: ['Full Body'],
    instructions: ['Touch tip of index finger to tip of thumb', 'Other fingers extended naturally', 'Rest backs of hands on knees', 'Chin = consciousness; represents Jiva-Brahman unity'],
    purana: 'Represents Jivatma (individual soul) uniting with Paramatma (Brahman) — Upanishads',
  },
  {
    id: 'anjali_mudra', name: 'Prayer Gesture', sanskrit: 'Anjali Mudra (अञ्जलिमुद्रा)',
    type: 'mudra', form: 'mudra', duration: 60, difficulty: 'beginner',
    benefits: ['Centers the mind', 'Acknowledges the divine', 'Balances left and right hemispheres'],
    chakra: 'Anahata (Heart)', bodyParts: ['Full Body'],
    instructions: ['Press palms together at heart', 'Thumbs touch sternum', 'Fingers point upward', 'Bow head slightly — Namaste: I bow to the divine in you'],
    purana: 'Universal greeting in Vedic tradition — represents Brahman in all beings',
  },
  {
    id: 'shambhavi_mudra', name: 'Eyebrow Center Gazing', sanskrit: 'Shambhavi Mudra (शाम्भवी मुद्रा)',
    type: 'mudra', form: 'mudra', duration: 180, difficulty: 'intermediate',
    benefits: ['Activates Ajna (third eye)', 'Deepens meditation', 'Awakens intuition'],
    chakra: 'Ajna (Third Eye)', bodyParts: ['Full Body'],
    instructions: ['Gaze up and inward at Ajna chakra', 'Eyes look toward eyebrow center', 'No strain — soft, internal gaze', 'Hold as long as comfortable'],
    purana: 'Shambhu = Shiva; this is Shiva\'s gaze (Shiva Samhita 4.15)',
    caution: 'Do not strain eyes',
  },
  {
    id: 'mula_bandha', name: 'Root Lock', sanskrit: 'Mula Bandha (मूलबन्ध)',
    type: 'bandha', form: 'mudra', duration: 120, difficulty: 'intermediate',
    benefits: ['Redirects Apana Vayu upward', 'Activates Muladhara', 'Contains Prana', 'Awakens Kundalini'],
    chakra: 'Muladhara (Root)', bodyParts: ['Abs', 'Glutes'],
    instructions: ['Sit in meditation posture', 'Contract perineum muscles upward', 'Hold during Kumbhaka (breath retention)', 'Release on exhale', 'Mula = root, source of all energy'],
    purana: 'Hatha Yoga Pradipika 3.61: "forces Apana to unite with Prana"',
  },
];

export const YOGA_FORMS: YogaForm[] = [
  {
    id: 'surya_namaskar',
    name: 'Sun Salutation',
    sanskrit: 'Surya Namaskar (सूर्य नमस्कार)',
    emoji: '☀️',
    description: 'The ancient 12-pose sequence offered to Surya, the Sun God. Performed at dawn facing east, it honors the source of all life and energy.',
    origin: 'Rig Veda, Ashtanga tradition, Surya Upanishad',
    duration: '10-30 minutes',
    benefits: ['Full body activation', 'Synchronized breath movement', 'Stimulates all chakras', 'Purifies 72,000 nadis', 'Balances solar energy'],
    mudras: ['pranamasana', 'hastauttanasana', 'padahastasana', 'ashwa_sanchalanasana', 'dandasana', 'ashtanga_namaskar', 'bhujangasana', 'adho_mukha'],
  },
  {
    id: 'hatha',
    name: 'Hatha Yoga',
    sanskrit: 'Hatha Yoga (हठयोग)',
    emoji: '🔱',
    description: 'Ha = Sun, Tha = Moon. The yoga of force and balance between solar and lunar energies. Foundation of all modern yoga styles.',
    origin: 'Hatha Yoga Pradipika (Swatmarama, 15th century), Gheranda Samhita',
    duration: '45-90 minutes',
    benefits: ['Physical purification (Shatkarma)', 'Prepares body for meditation', 'Balances Ida and Pingala nadis', 'Strengthens all body systems'],
    mudras: ['vrikshasana', 'trikonasana', 'virabhadrasana1', 'virabhadrasana2', 'setu_bandha', 'paschimottanasana', 'matsyasana', 'natarajasana', 'kurmasana', 'savasana'],
  },
  {
    id: 'pranayama',
    name: 'Pranayama',
    sanskrit: 'Pranayama (प्राणायाम)',
    emoji: '🌬️',
    description: 'Prana = life force, Ayama = expansion. Control of the breath to purify the 72,000 nadis and prepare the mind for meditation.',
    origin: 'Patanjali Yoga Sutras (4th limb), Hatha Yoga Pradipika Chapter 2',
    duration: '15-30 minutes',
    benefits: ['Purifies all 72,000 nadis', 'Calms the nervous system', 'Awakens Kundalini', 'Prepares mind for Dharana and Dhyana'],
    mudras: ['nadi_shodhana', 'kapalabhati', 'bhramari', 'ujjayi', 'bhastrika'],
  },
  {
    id: 'mudra',
    name: 'Mudras & Bandhas',
    sanskrit: 'Mudra & Bandha (मुद्रा & बन्ध)',
    emoji: '🤲',
    description: 'Mudra = gesture, Bandha = lock. Seals and locks that redirect prana within the body, awakening dormant energies.',
    origin: 'Hatha Yoga Pradipika Chapter 3, Shiva Samhita, Gheranda Samhita',
    duration: '10-20 minutes',
    benefits: ['Direct prana in the body', 'Awaken Kundalini Shakti', 'Connect individual to cosmic consciousness', 'Stimulate chakras'],
    mudras: ['chin_mudra', 'anjali_mudra', 'shambhavi_mudra', 'mula_bandha'],
  },
];

// Get mudras for a form
export function getMudrasForForm(formId: string): YogaMudra[] {
  const form = YOGA_FORMS.find((f) => f.id === formId);
  if (!form) return [];
  return form.mudras.map((id) => YOGA_MUDRAS.find((m) => m.id === id)).filter(Boolean) as YogaMudra[];
}

export const CHAKRA_COLORS: Record<string, string> = {
  'Muladhara (Root)': '#FF0000',
  'Swadhisthana (Sacral)': '#FF6B00',
  'Manipura (Solar Plexus)': '#FFD700',
  'Anahata (Heart)': '#00AA44',
  'Vishuddha (Throat)': '#0088FF',
  'Ajna (Third Eye)': '#4400AA',
  'Sahasrara (Crown)': '#8800FF',
};
