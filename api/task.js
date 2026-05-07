module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { context } = req.body || {};
  if (!context) return res.status(400).json({ error: 'No context provided' });

  const system = `You are Andrew's personal AI strategist. Output the single most important action Andrew should take right now.

Andrew is the founder of The Novello Co. — premium body scrub brand. Dead Sea salt base, 3 variants, $72/unit, $15 cost. Tagline: "The Truth Behind Youth." He is mission-driven, executes well when given a clear plan, gut-first decision maker. Perfectionism is his biggest enemy. Needs visible momentum. Philosophy: Energy, Intention, Devotion. $3,400/mo income, $3,000 expenses, $30k debt, no savings. Exit 9-5 in 90 days. Needs 48 bottles/month to replace income. Small network, weak at closing, no online presence yet.

Sequence: supply chain first, then unit economics, then inventory, then direct sales, then online presence, then scale. Never recommend marketing before supply chain is solved.

Output format (follow exactly):
**Your task right now:**
[5 words or fewer task name]
[2-4 sentences: exactly what to do, how, what done looks like]
**Why this is the move:**
[1-2 sentences. No fluff.]
**Accountability:**
[One direct sentence. Push him. Reference 90-day clock or perfectionism.]`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: `Andrew's data:\n${context}\n\nWhat is his single most important task right now?` }]
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'Anthropic API error', details: d });
    return res.status(200).json({ task: d.content.map(i => i.text || '').join('') });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', message: e.message });
  }
};
