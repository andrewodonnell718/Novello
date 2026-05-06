export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text, type } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  let prompt = '';
  if (type === 'nutrition') {
    prompt = `You are a precise nutrition analyst. The user described food they ate. Even if vague, make your best estimate based on typical serving sizes. Always return numbers. Return ONLY valid JSON, no markdown: {"calories":number,"protein":number,"carbs":number,"fats":number,"fiber":number,"summary":"one sentence"} Food: ${text}`;
  } else if (type === 'muscle') {
    prompt = `Fitness expert. Identify muscles worked by exercise: "${text}". Use ONLY: chest,front-delts,side-delts,rear-delts,traps,lats,upper-back,lower-back,biceps,triceps,forearms,abs,obliques,quads,hamstrings,glutes,calves,hip-flexors. Return ONLY valid JSON: {"front":["muscle1"],"back":["muscle2"]}`;
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: 'Anthropic API error' });
    const raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}
