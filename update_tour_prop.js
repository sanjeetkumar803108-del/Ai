const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");
content = content.replace(
  "  onShowFeedback: () => void;\n  schemes: Scheme[];\n}) => {",
  "  onShowFeedback: () => void;\n  schemes: Scheme[];\n  onRestartTour?: () => void;\n}) => {"
);
content = content.replace(
  "                  onShowFeedback={() => handleShowFeedback(\"general\")}\n                  schemes={communitySchemes}\n                />",
  "                  onShowFeedback={() => handleShowFeedback(\"general\")}\n                  schemes={communitySchemes}\n                  onRestartTour={() => setDashboardTourStep(1)}\n                />"
);
fs.writeFileSync("src/App.tsx", content);
