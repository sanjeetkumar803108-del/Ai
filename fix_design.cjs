const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Mitra Skill Finder redesign
code = code.replace(
  /className="relative group\/rainbow p-\[3px\] rounded-\[2\.5rem\] overflow-hidden shadow-md cursor-pointer active:scale-\[0\.98\] transition-all duration-300"/g,
  'className="relative group/rainbow p-[2px] rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-all duration-300"'
);
code = code.replace(
  /bg-\[conic-gradient\(from_0deg,#ff453a,#ff9f0a,#ffd60a,#30d158,#0a84ff,#5e5ce6,#ff453a\)\]/g,
  'bg-gradient-to-r from-[#008069] via-emerald-500 to-[#008069]'
);
code = code.replace(
  /bg-slate-900 p-5 rounded-\[2\.35rem\]/g,
  'bg-emerald-900 p-5 rounded-[15px]'
);
code = code.replace(
  /bg-gradient-to-tr from-amber-400 to-yellow-500/g,
  'bg-gradient-to-tr from-[#008069] to-emerald-400 text-white'
);

// Gig Finder redesign
code = code.replace(
  /bg-\[conic-gradient\(from_0deg,#008069,#10b981,#fbbf24,#34d399,#008069\)\]/g,
  'bg-gradient-to-r from-emerald-500 to-teal-400'
);

// 2. Remove Emojis from Headings and text
code = code.replace(/ MITRA SKILL FINDER 🚀/g, ' MITRA SKILL FINDER');
code = code.replace(/ offline-first active 📱/g, ' offline-first active');
code = code.replace(/ Shuru Karein! 🎉/g, ' Shuru Karein!');
code = code.replace(/ Aage Chalo ➡️/g, ' Aage Chalo');
code = code.replace(/ Badhai ho! 🥳/g, ' Badhai ho!');
code = code.replace(/ 🚀 /g, ' ');
code = code.replace(/ 💼 /g, ' ');
code = code.replace(/ 🔥 /g, ' ');
code = code.replace(/ 💡 /g, ' ');
code = code.replace(/ ✨ /g, ' ');
code = code.replace(/ 🎯 /g, ' ');
code = code.replace(/ 🏆 /g, ' ');
code = code.replace(/ 🛡️ /g, ' ');
code = code.replace(/ 📝 /g, ' ');
code = code.replace(/ 🤝 /g, ' ');
code = code.replace(/ 💰 /g, ' ');
code = code.replace(/ 📊 /g, ' ');
code = code.replace(/ 🎓 /g, ' ');
code = code.replace(/ 🏥 /g, ' ');
code = code.replace(/ 👨‍🌾 /g, ' ');
code = code.replace(/ 👩‍🎓 /g, ' ');
code = code.replace(/ 👨‍🔧 /g, ' ');

// 3. Info Cards standardization
// Let's replace some common classes
// bg-white p-5 rounded-[2rem] -> bg-white p-5 rounded-2xl shadow-sm border border-gray-100
code = code.replace(/bg-white p-5 rounded-\[2rem\]/g, 'bg-white p-5 rounded-2xl shadow-sm border border-gray-100');
code = code.replace(/bg-white p-6 rounded-\[2\.5rem\]/g, 'bg-white p-5 rounded-2xl shadow-sm border border-gray-100');
code = code.replace(/bg-white p-6 rounded-3xl/g, 'bg-white p-5 rounded-2xl shadow-sm border border-gray-100');
code = code.replace(/bg-white p-5 rounded-3xl/g, 'bg-white p-5 rounded-2xl shadow-sm border border-gray-100');
code = code.replace(/bg-white p-4 rounded-3xl/g, 'bg-white p-4 rounded-2xl shadow-sm border border-gray-100');
code = code.replace(/rounded-3xl/g, 'rounded-2xl');
code = code.replace(/rounded-\[2\.5rem\]/g, 'rounded-2xl');
code = code.replace(/rounded-\[2rem\]/g, 'rounded-2xl');

// Button Standardization
// Primary: bg-[#008069] text-white py-4 rounded-2xl font-bold
// For full-width primary CTA
code = code.replace(/bg-slate-900 text-white/g, 'bg-[#008069] text-white');
code = code.replace(/bg-slate-800 text-white/g, 'bg-[#008069] text-white');
code = code.replace(/bg-emerald-600 text-white/g, 'bg-[#008069] text-white');
code = code.replace(/bg-teal-600 text-white/g, 'bg-[#008069] text-white');

// Expandable text for line-clamp
code = code.replace(/className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed"/g, 'className="text-xs text-gray-500 font-medium leading-relaxed"');
code = code.replace(/className="text-\[11px\] text-gray-500 font-bold leading-relaxed line-clamp-2"/g, 'className="text-[11px] text-gray-500 font-bold leading-relaxed"');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
