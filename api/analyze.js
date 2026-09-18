// /api/analyze.js
// Vercel serverless function — proxies contract text to Claude and returns
// a structured clause-by-clause risk breakdown.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractText } = req.body || {};
  if (!contractText || typeof contractText !== 'string' || contractText.trim().length < 20) {
    return res.status(400).json({ error: 'Please provide contract text to analyze.' });
  }

  const systemPrompt = `You are a contract risk assistant for freelancers and small agencies.
Analyze the contract text the user provides. Identify the clauses that matter most
(payment terms, IP ownership, liability, termination/kill fees, scope creep, confidentiality,
non-compete, indemnification). For each clause found, output:
- title: short label for the clause
- risk: one of "red", "yellow", "green" (red = high risk to the freelancer/agency, yellow = worth negotiating, green = standard/fair)
- explanation: 1-2 plain-English sentences on why it matters
- rewrite: a short suggested safer alternative phrasing (omit or leave empty for green-risk clauses)

Respond with ONLY valid JSON in this exact shape, no markdown fences, no preamble:
{"clauses":[{"title":"...","risk":"red|yellow|green","explanation":"...","rewrite":"..."}]}

Limit to the 5-8 most important clauses. If the text is not a contract, return
{"clauses":[]}.`;

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: contractText.slice(0, 12000) },
        ],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Anthropic API error:', errText);
      return res.status(502).json({ error: 'Analysis service unavailable.' });
    }

    const data = await apiRes.json();
    const rawText = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse model output:', cleaned);
      return res.status(502).json({ error: 'Could not parse analysis output.' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('analyze.js error:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
