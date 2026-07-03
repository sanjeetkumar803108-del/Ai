const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  useEffect(() => {
    setActiveSuggestions(getProfileBasedSuggestions(userProfile));
  }, [userProfile, activeConversationId]);`;

const replacement1 = `  useEffect(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    setActiveSuggestions(getProfileBasedSuggestions(userProfile, lastUserMsg?.content));
  }, [userProfile, activeConversationId, messages]);`;

const target2 = `  const handleShuffleSuggestions = () => {
    setActiveSuggestions(getProfileBasedSuggestions(userProfile));
  };`;

const replacement2 = `  const handleShuffleSuggestions = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    setActiveSuggestions(getProfileBasedSuggestions(userProfile, lastUserMsg?.content));
  };`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed suggestion update logic');
