const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex flex-col max-w-[85%] rounded-2xl p-3 shadow-sm relative",
              m.role === "user"
                ? "ml-auto bg-[#DCF8C6] text-gray-800 rounded-tr-none border border-[#C7E9B0]"
                : "mr-auto bg-white text-gray-900 border border-gray-100 rounded-tl-none",
            )}`;

const newStr = `        {messages.map((m) => {
          const isErrorMsg = m.isError || m.content.includes("server thoda busy lag raha") || m.content.includes("Server mein kuch dikkat hai") || (m.thought && m.thought.startsWith("Error:"));
          
          return (
          <div
            key={m.id}
            className={cn(
              "flex flex-col max-w-[85%] rounded-2xl p-3 shadow-sm relative",
              m.role === "user"
                ? "ml-auto bg-[#DCF8C6] text-gray-800 rounded-tr-none border border-[#C7E9B0]"
                : isErrorMsg
                  ? "mr-auto bg-red-50 text-red-900 border border-red-200 rounded-tl-none"
                  : "mr-auto bg-white text-gray-900 border border-gray-100 rounded-tl-none",
            )}`;

code = code.replace(targetStr, newStr);

const thoughtStr = `{m.role === "assistant" && m.thought && (`;
const newThoughtStr = `{m.role === "assistant" && m.thought && !isErrorMsg && (`;
code = code.replace(thoughtStr, newThoughtStr);

// Change the footer (thumbs up/down) to not show if isErrorMsg
const ratingStr = `{m.role === "assistant" && m.id !== "welcome" && (`;
const newRatingStr = `{m.role === "assistant" && m.id !== "welcome" && !isErrorMsg && (`;
code = code.replace(ratingStr, newRatingStr);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed messages');
