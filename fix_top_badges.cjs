const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = '{!isAiResult && (';

const injectStr = `{(() => {
                  const trackingApp = applications.find(
                    (a) => a.schemeName === scheme.hindiName || a.schemeName === scheme.name
                  );
                  if (!trackingApp || !trackingApp.status) return null;
                  
                  let bg = "bg-gray-100 text-gray-700 border-gray-200";
                  if (trackingApp.status === "Approved") bg = "bg-green-500 text-white border-green-600";
                  else if (trackingApp.status === "Rejected") bg = "bg-red-500 text-white border-red-600";
                  else if (trackingApp.status === "Submitted") bg = "bg-blue-500 text-white border-blue-600";
                  else bg = "bg-orange-500 text-white border-orange-600";
                  
                  return (
                    <div className={cn("px-2.5 py-1 rounded-lg flex items-center gap-1.5 border shadow-sm shrink-0", bg)}>
                      <LayoutDashboard className="w-3 h-3 shrink-0" />
                      <span className="text-[8px] uppercase tracking-tighter font-black">
                        {trackingApp.status}
                      </span>
                    </div>
                  );
                })()}
                `;

code = code.replace(targetStr, injectStr + targetStr);

fs.writeFileSync('src/App.tsx', code);
console.log('Added top badges');
