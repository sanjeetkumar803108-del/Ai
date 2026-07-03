const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                  1. Upload Filled Form
                </h3>`;

const replacement = `<div className="flex flex-col gap-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                  1. Select Target Scheme
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Which scheme form are you auditing?
                </p>
              </div>

              {!initialScheme ? (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search schemes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#008069] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                    {filteredSchemes.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedScheme(s)}
                        className={\`text-left p-3 rounded-xl border transition-all \${selectedScheme?.id === s.id ? 'bg-[#008069]/10 border-[#008069] text-[#008069]' : 'bg-white border-gray-100 hover:border-[#008069]/30 text-gray-700'}\`}
                      >
                        <p className="font-bold text-sm truncate">{s.name}</p>
                        <p className="text-[10px] uppercase tracking-widest opacity-70 truncate">{s.hindiName}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#008069]/10 border border-[#008069] p-4 rounded-xl">
                  <p className="font-bold text-[#008069] text-sm">{selectedScheme.name}</p>
                  <p className="text-[10px] text-[#008069]/70 uppercase tracking-widest">{selectedScheme.hindiName}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                  2. Upload Filled Form
                </h3>`;

code = code.replace(target, replacement);

// Wait, the disabled logic on the button is disabled={(!image && !imageFile) || auditing}
// It should be disabled={(!image && !imageFile) || auditing || !selectedScheme}
code = code.replace(/disabled=\{\(!image && !imageFile\) \|\| auditing\}/, 'disabled={(!image && !imageFile) || auditing || !selectedScheme}');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed Form Audit Scheme Selector');
