const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The logic is:
// if (progressPct === 100) { ... }
// else if (progressPct >= 50) { ... }
// else if (progressPct > 0) { ... }
// else {
//   statusLabel = `Documents upload baaki hain (0/${totalCount})`;
//   // WE NEED TO CHANGE THE COLOR HERE
// }

code = code.replace(
  /statusLabel = \`Documents upload baaki hain \(0\/\$\{totalCount\}\)\`;\s*}/g,
  `statusLabel = \`Documents upload baaki hain (0/\${totalCount})\`;
                    
                    const daysLeft = scheme.deadline ? Math.ceil((scheme.deadline - Date.now()) / (24 * 60 * 60 * 1000)) : 999;
                    if (daysLeft <= 3 && daysLeft > 0) {
                      statusBg = "bg-rose-50 border-rose-100/60 text-rose-600";
                      barColor = "bg-rose-500";
                    } else {
                      statusBg = "bg-slate-50 border-slate-200 text-slate-500";
                      barColor = "bg-slate-300";
                    }
                  }`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed document readiness colors');
