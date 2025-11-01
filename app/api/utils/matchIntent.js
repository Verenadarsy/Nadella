export function matchIntent(message, intents) {
  const msg = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const intent of intents) {
    const kwList = intent.keywords?.split(",").map(k => k.trim()) || [];
    let score = 0;
    kwList.forEach(k => {
      if (msg.includes(k)) score += 1;
    });
    if (msg.includes(intent.intent)) score += 2;
    if (msg.includes(intent.description.split(" ")[1]?.toLowerCase())) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  return bestMatch;
}
