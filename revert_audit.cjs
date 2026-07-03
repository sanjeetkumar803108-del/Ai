const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetRegex = /<div className="flex flex-col gap-2">[\s\n]*<h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">[\s\n]*1\. Select Target Scheme[\s\n]*<\/h3>[\s\n]*<p className="text-xs text-gray-500 font-medium">[\s\n]*Which scheme form are you auditing\?[\s\n]*<\/p>[\s\n]*<\/div>[\s\n]*\{\!initialScheme \? \([\s\n]*<div className="flex flex-col gap-3">[\s\n]*<div className="relative">[\s\n]*<Search className="w-4 h-4 absolute left-3 top-1\/2 -translate-y-1\/2 text-gray-400" \/>[\s\n]*<input[\s\n]*type="text"[\s\n]*placeholder="Search schemes\.\.\."[\s\n]*value=\{searchQuery\}[\s\n]*onChange=\{\(e\) => setSearchQuery\(e\.target\.value\)\}[\s\n]*className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-\[#008069\] transition-colors"[\s\n]*\/>[\s\n]*<\/div>[\s\n]*<div className="flex flex-col gap-2 max-h-40 overflow-y-auto">[\s\n]*\{filteredSchemes\.map\(\(s, idx\) => \([\s\n]*<button[\s\n]*key=\{idx\}[\s\n]*onClick=\{\(\) => setSelectedScheme\(s\)\}[\s\n]*className=\{\`text-left p-3 rounded-xl border transition-all \$\{selectedScheme\?\.id === s\.id \? 'bg-\[#008069\]\/10 border-\[#008069\] text-\[#008069\]' : 'bg-white border-gray-100 hover:border-\[#008069\]\/30 text-gray-700'\}\`\}[\s\n]*>[\s\n]*<p className="font-bold text-sm truncate">\{s\.name\}<\/p>[\s\n]*<p className="text-\[10px\] uppercase tracking-widest opacity-70 truncate">\{s\.hindiName\}<\/p>[\s\n]*<\/button>[\s\n]*\)\)\}[\s\n]*<\/div>[\s\n]*<\/div>[\s\n]*\) : \([\s\n]*<div className="bg-\[#008069\]\/10 border border-\[#008069\] p-4 rounded-xl">[\s\n]*<p className="font-bold text-\[#008069\] text-sm">\{selectedScheme\.name\}<\/p>[\s\n]*<p className="text-\[10px\] text-\[#008069\]\/70 uppercase tracking-widest">\{selectedScheme\.hindiName\}<\/p>[\s\n]*<\/div>[\s\n]*\)\}[\s\n]*<div className="flex flex-col gap-2">[\s\n]*<h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">[\s\n]*2\. Upload Filled Form/s;

const replacement = `<div className="flex flex-col gap-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                  1. Upload Filled Form`;

code = code.replace(targetRegex, replacement);

// Revert button disabled logic
code = code.replace(/disabled=\{\(!image && !imageFile\) \|\| auditing \|\| !selectedScheme\}/, 'disabled={(!image && !imageFile) || auditing}');

fs.writeFileSync('src/App.tsx', code);
console.log('Reverted Form Audit Scheme Selector');
