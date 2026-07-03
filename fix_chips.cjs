const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldFunc = /const getProfileBasedSuggestions = [\s\S]*?return result;\n\};/;
const newFunc = `const getProfileBasedSuggestions = (profile: UserProfile, context?: string): string[] => {
  // Base default chips
  let chips = [
    "🏥 Ayushman Card",
    "🌾 PM Kisan Status",
    "📄 Form Bharne Mein Help",
    "💼 Sarkari Naukri",
    "🎓 Scholarship Dhundho",
    "🏠 Awas Yojana"
  ];
  
  if (context) {
    const ctx = context.toLowerCase();
    if (ctx.includes("health") || ctx.includes("bimar") || ctx.includes("swasthya") || ctx.includes("ayushman")) {
      chips = ["🏥 Ayushman Card Check", "💊 Free Medicine Scheme", "🩺 Govt Hospital Help", "💉 Vaccination Status", "🚑 Emergency Ambulance", "📄 Health Insurance Form"];
    } else if (ctx.includes("farm") || ctx.includes("agriculture") || ctx.includes("kisan") || ctx.includes("fasal")) {
      chips = ["🌾 PM Kisan Samman Nidhi", "🚜 Tractor Subsidy", "💧 Fasal Bima Yojana", "💳 Kisan Credit Card", "🌱 Khad Beej Scheme", "💰 Krishi Loan Help"];
    } else if (ctx.includes("edu") || ctx.includes("scholarship") || ctx.includes("padhai") || ctx.includes("college") || ctx.includes("student")) {
      chips = ["🎓 NSP Scholarship Status", "📚 Free Books Scheme", "💻 Free Laptop Yojana", "🏫 College Admission Help", "📝 Education Loan", "🚌 Free Transport/Pass"];
    } else if (ctx.includes("job") || ctx.includes("naukri") || ctx.includes("rozgar") || ctx.includes("employment")) {
      chips = ["💼 Sarkari Naukri Updates", "🛠️ Skill India Training", "📋 MNREGA Job Card", "💰 Mudra Loan", "👔 Rojgar Mela Info", "📝 Resume Banane me Help"];
    }
  }

  return chips;
};`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed chips');
