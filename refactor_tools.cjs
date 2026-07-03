const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const startIdx = code.indexOf('const ToolsScreen = (');
const endIdx = code.indexOf('const PhotoStudio = (');

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find ToolsScreen");
  process.exit(1);
}

let toolsScreenStr = code.substring(startIdx, endIdx);

// 1. Fix AI Screen Guru visual hierarchy
// Currently it is:
// "bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col gap-6 cursor-pointer transition-all border border-transparent",
// isGuruActive ? "border-[#008069] ring-2 ring-[#008069]/20" : "hover:border-white/10"
// text-white, etc.

toolsScreenStr = toolsScreenStr.replace(
  /"bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col gap-6 cursor-pointer transition-all border border-transparent"/,
  '"bg-gradient-to-br from-[#E6F4F1] to-white p-6 rounded-2xl shadow-sm flex flex-col gap-6 cursor-pointer transition-all border border-[#008069]/20 min-h-[48px]"'
);
toolsScreenStr = toolsScreenStr.replace(
  /"hover:border-white\/10"/,
  '"hover:border-[#008069]/40 hover:shadow-md"'
);
// replace bg-white/10 with bg-white/50 for the icon container
toolsScreenStr = toolsScreenStr.replace(
  /"bg-white\/10 text-\[#008069\]"/,
  '"bg-white text-[#008069] shadow-sm"'
);
// replace text-white for title with text-gray-900
toolsScreenStr = toolsScreenStr.replace(
  /text-white(?= leading-tight>\s*AI Screen Guru)/,
  'text-gray-900'
);
// replace text-white/20 for chevron with text-gray-300
toolsScreenStr = toolsScreenStr.replace(
  /text-white\/20(?= "\s*\/>\s*\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<PhotoStudio)/,
  'text-gray-300 group-hover:text-[#008069]'
);
// Add premium badge next to title
toolsScreenStr = toolsScreenStr.replace(
  /(<h3[^>]*>)\s*AI Screen Guru\s*(<\/h3>)/,
  '$1<div className="flex items-center gap-2">AI Screen Guru <span className="text-[8px] font-black bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Premium</span></div>$2'
);


// 2. Add Breathing Room & Touch Target
// Replace all p-5 inside ToolsScreen with p-6 and add min-h-[48px]
toolsScreenStr = toolsScreenStr.replace(/p-5 rounded-2xl/g, 'p-6 rounded-2xl min-h-[48px]');
// Yojana finder is p-6 already, let's add min-h-[48px]
toolsScreenStr = toolsScreenStr.replace(/p-6 rounded-2xl/g, 'p-6 rounded-2xl min-h-[48px]');

// 3. Bottom Navigation Clearance
// Increase pb-32 to pb-40
toolsScreenStr = toolsScreenStr.replace(/className="p-6 pb-32 flex flex-col gap-6"/, 'className="p-6 pb-40 flex flex-col gap-6"');


// Let's also check if "Yojana Finder" text-white is ok. The prompt says "Change it to a light-themed card (matching the others) but give it a subtle premium touch" specifically for "AI SCREEN GURU". Yojana Finder is not mentioned to be changed, but it says "The last card ('Yojana Finder') must scroll completely above".

// Apply back
code = code.substring(0, startIdx) + toolsScreenStr + code.substring(endIdx);
fs.writeFileSync('src/App.tsx', code);
console.log("Refactored ToolsScreen");
