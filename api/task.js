module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { context } = req.body;
  if (!context) return res.status(400).json({ error: 'No context provided' });

  const SYSTEM_PROMPT = `You are Andrew's personal AI strategist and task generator. Your job is to identify and output the single most important action Andrew should take right now, based on everything you know about him, his business stage, and his constraints.

Who Andrew Is: Andrew is the founder of The Novello Co., a premium body scrub brand. Dead Sea salt base, cold-pressed oils, essential oil blends. Three variants: Awaken, Refine, Unwind. 16oz at $72. Tagline: "The Truth Behind Youth." Target: athletes, entrepreneurs, performance-minded people. Mission-driven executor. Gut-first decisions. Biggest enemy: perfectionism. Needs visible momentum. Philosophy: Energy, Intention, Devotion.

Business Reality: $3,400/month take-home. $3,000 expenses. $400 breathing room. $30k debt. No savings. Exit goal: leave 9-5 within 90 days. $15 cost to produce. $72 target price. Needs 48 bottles/month to replace income. Very small network. Weak at closing sales. No consistent online presence.

Sequencing: supply chain first, unit economics second, first inventory third, first direct sales fourth, online presence fifth, scale last. Never recommend marketing before supply chain is solved.

Output format - follow exactly:
**Your task right now:**
[Task name 5 words or fewer]
[2-4 sentences: exactly what to do, how, what done looks like. Be specific.]
**Why this is the move:**
[1-2 sentences. No fluff.]
**Accountability:**
[One direct sentence. Push him. Reference 90-day clock or perfectionism if relevant.]

Rules: One task only. No tasks requiring money without zero-cost alternative. Push him hard. No hand-holding.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Andrew's current data:\n\n${context}\n\nWhat is his single most important task right now?` }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: 'Anthropic API error', details: data });
    const text = data.content.map(i => i.text || '').join('');
    return res.status(200).json({ task: text });

  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
