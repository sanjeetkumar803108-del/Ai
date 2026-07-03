const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `onClick={(e) => {
                    e.stopPropagation();
                    onAskMitra(scheme.name);
                  }}
                  className={cn(
                    "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2",
                    scheme.officialUrl
                      ? "bg-white text-[#008069] hover:bg-green-50"
                      : "bg-[#008069] text-white hover:bg-[#005c4b]",
                  )}`;

const injectStr = `onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isExpanded ? null : scheme.id);
                  }}
                  className={cn(
                    "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2",
                    "bg-white text-gray-700 hover:bg-gray-50 border-r border-gray-100"
                  )}`;

code = code.replace(targetStr, injectStr);

// Let's also remove the ChevronUp/ChevronDown section since "Details" will handle it, or keep it.
// The user just said "Details" button click karne par expand ho.

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed details button');
