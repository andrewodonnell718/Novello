export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, type } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  let prompt = '';

  if (type === 'nutrition') {
    prompt = `You are a precise nutrition analyst. The user has described food they ate. Even if the description is vague or incomplete, make your best educated estimate based on typical serving sizes and common preparations. Always return numbers — never refuse to estimate.

Return ONLY a valid JSON object with no markdown, no explanation, no extra text. Just the raw JSON.

Format: {"calories":number,"protein":number,"carbs":number,"fats":number,"fiber":number,"summary":"one sentence description of what was analyzed"}

Food description: ${text}`;
  } else if (type === 'muscle') {
    prompt = `You are a certified fitness expert and anatomy specialist. Identify which muscles are worked by the exercise: "${text}".

Return ONLY a valid JSON object with no markdown, no explanation, no extra text. Just the raw JSON.

Use ONLY these exact muscle names: chest, front-delts, side-delts, rear-delts, traps, lats, upper-back, lower-back, biceps, triceps, forearms, abs, obliques, quads, hamstrings, glutes, calves, hip-flexors

Format: {"front":["muscle1","muscle2"],"back":["muscle3"]}`;
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }

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
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(500).json({ error: 'API error', details: data });
    }

    const raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}
