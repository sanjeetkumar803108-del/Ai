import { Scheme } from './types';

export const SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    name: 'PM Kisan Samman Nidhi',
    hindiName: 'PM किसान सम्मान निधि',
    description: 'Income support of ₹6,000 per year in three equal installments to all landholding farmer families.',
    hindiDescription: 'सभी भूमिधारक किसान परिवारों को तीन समान किस्तों में ₹6,000 प्रति वर्ष की आय सहायता।',
    eligibility: ['Small and marginal farmers', 'Land ownership proof required'],
    benefits: ['₹2,000 every 4 months', 'Direct Benefit Transfer (DBT)'],
    documents: ['Aadhar Card', 'Land Records', 'Bank Account Details'],
    category: 'Agriculture',
    officialUrl: 'https://pmkisan.gov.in/'
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat (PM-JAY)',
    hindiName: 'आयुष्मान भारत (PM-JAY)',
    description: 'Health cover of ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
    hindiDescription: 'द्वितीयक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष ₹5 लाख का स्वास्थ्य कवर।',
    eligibility: ['Low-income families', 'List based on SECC 2011 data'],
    benefits: ['Cashless treatment', 'Covers pre and post hospitalization'],
    documents: ['Aadhar Card', 'Ration Card', 'PM Letter (if available)'],
    category: 'Health',
    officialUrl: 'https://pmjay.gov.in/'
  },
  {
    id: 'ration-card',
    name: 'Ration Card (NFSA)',
    hindiName: 'राशन कार्ड (राष्ट्रीय खाद्य सुरक्षा अधिनियम)',
    description: 'Subsidized food grains through the Public Distribution System (PDS).',
    hindiDescription: 'सार्वजनिक वितरण प्रणाली (PDS) के माध्यम से रियायती खाद्यान्न।',
    eligibility: ['Citizens below poverty line', 'Depends on state-specific criteria'],
    benefits: ['Rice, Wheat at low costs', 'Identity proof for other schemes'],
    documents: ['Aadhar Card', 'Address Proof', 'Income Certificate'],
    category: 'Social',
  },
  {
    id: 'kanya-sumangala',
    name: 'Mukhya Mantri Kanya Sumangala Yojana',
    hindiName: 'मुख्यमंत्री कन्या सुमंगला योजना',
    description: 'Financial assistance to girl children in Uttar Pradesh for education and health.',
    hindiDescription: 'उत्तर प्रदेश में बालिकाओं को शिक्षा और स्वास्थ्य के लिए वित्तीय सहायता।',
    eligibility: ['Permanent resident of Uttar Pradesh', 'Family income below 3 lakh'],
    benefits: ['₹15,000 in total installments', 'Educational support'],
    documents: ['Aadhar Card', 'Birth Certificate', 'Income Certificate'],
    category: 'Social',
    state: 'Uttar Pradesh'
  },
  {
    id: 'bihar-student-credit-card',
    name: 'Bihar Student Credit Card Scheme',
    hindiName: 'बिहार स्टूडेंट क्रेडिट कार्ड योजना',
    description: 'Education loan of up to ₹4 lakh for students of Bihar for higher education.',
    hindiDescription: 'उच्च शिक्षा के लिए बिहार के छात्रों के लिए ₹4 लाख तक का शिक्षा ऋण।',
    eligibility: ['Resident of Bihar', 'Passed 12th standard'],
    benefits: ['Low interest loan', 'Covers tuition and living expenses'],
    documents: ['Aadhar Card', 'Marksheets', 'Valid ID'],
    category: 'Education',
    state: 'Bihar'
  }
];

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manitoba", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];
