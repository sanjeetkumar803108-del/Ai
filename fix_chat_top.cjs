const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const [animatedMessageIds, setAnimatedMessageIds] = useState<Record<string, boolean>>({});`;

const newStr = `  const [animatedMessageIds, setAnimatedMessageIds] = useState<Record<string, boolean>>({});
  const [showWelcomeAnim, setShowWelcomeAnim] = useState(true);
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  let pressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowWelcomeAnim(false), 2000);
    return () => clearTimeout(t);
  }, []);
  
  const handlePressStart = (id: string) => {
    pressTimer.current = setTimeout(() => setActiveReactionId(id), 500);
  };
  
  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed chat state');
