const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const trackStatusBlock = code.match(/\{\/\* Application Tracking \*\/\}[\s\S]*?<\/select>\s*<\/div>/)[0];

const eligibilityBenefitDocsBlock = code.match(/<div className="grid grid-cols-3 gap-2 mt-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)[0];

// Remove TrackStatus from its current place
code = code.replace(trackStatusBlock, '');

// Remove the Sarkari Link CTA
const sarkariCtaBlock = code.match(/\{scheme\.officialUrl && \(\s*<a\s*href=\{scheme\.officialUrl\}[\s\S]*?Apply Now \(Sarkari Link\)\s*<\/a>\s*\)\}/)[0];
code = code.replace(sarkariCtaBlock, '');

// Remove the Eligibility Report inside AnimatePresence
const eligibilityReportBlock = code.match(/\{\/\* Profile Eligibility matching report \*\/\}[\s\S]*?<\/div>\s*<\/div>/)[0];
code = code.replace(eligibilityReportBlock, '');

// Insert Track Status at the start of AnimatePresence expanded block
code = code.replace(
  /className="overflow-hidden flex flex-col gap-6 pt-4 border-t border-gray-50"\s*>/,
  `className="overflow-hidden flex flex-col gap-6 pt-4 border-t border-gray-50">\n                      ${trackStatusBlock}`
);

// We need to fix the Yojana Bulletin block icons.
code = code.replace(/<span className="text-lg"><\/span>/g, '<FileText className="w-5 h-5 text-amber-500" />');
code = code.replace(/ योजना का उद्देश्य \/ Purpose/g, 'योजना का उद्देश्य / Purpose');
code = code.replace(/ मुख्य फायदे \/ Benefits/g, 'मुख्य फायदे / Benefits');
code = code.replace(/ पात्रता नियम \/ Eligibility/g, 'पात्रता नियम / Eligibility');
code = code.replace(/ ज़रूरी दस्तावेज़ \/ Documents/g, 'ज़रूरी दस्तावेज़ / Documents');

fs.writeFileSync('src/App.tsx', code);
console.log('Restructured Card');
