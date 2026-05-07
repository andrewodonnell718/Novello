  module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, type } = req.body || {};
  if (!text) return res.status(400).json({ error: 'No text provided' });

  let maxTokens = 500;
  let model = 'claude-haiku-4-5-20251001';

  if (type === 'coach') {
    maxTokens = 16000;
    model = 'claude-haiku-4-5-20251001';
  } else if (type === 'task') {
    maxTokens = 600;
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: text }]
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'Anthropic API error', details: d });
    const raw = d.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    if (type === 'coach') return res.status(200).json({ result: raw });
    try {
      return res.status(200).json(JSON.parse(raw));
    } catch (e) {
      return res.status(200).json({ raw });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Server error', message: e.message });
  }
};
