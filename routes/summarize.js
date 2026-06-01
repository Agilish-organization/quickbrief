const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: require('path').join(__dirname, '../public') });
});

router.post('/summarize', async (req, res) => {
  const text = (req.body.text || '').trim();

  if (!text) {
    return res.redirect(303, '/?error=' + encodeURIComponent('Please paste some text first.'));
  }

  if (text.length < 50) {
    return res.redirect(303, '/?error=' + encodeURIComponent('Text is too short to summarize.'));
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Summarize the following text in exactly two parts:\n\n1. THREE bullet points (each ≤ 25 words, starting with "• ")\n2. A tweet version (≤ 280 characters, no hashtags, plain text)\n\nRespond in this exact format — nothing else:\nBULLETS:\n• [bullet 1]\n• [bullet 2]\n• [bullet 3]\n\nTWEET:\n[tweet text]\n\nText to summarize:\n${text}`,
        },
      ],
    });

    const raw = message.content[0].text;
    const bulletsMatch = raw.match(/BULLETS:\n((?:•[^\n]+\n?){1,3})/);
    const tweetMatch = raw.match(/TWEET:\n(.+)/s);

    const bulletsRaw = bulletsMatch ? bulletsMatch[1].trim() : '';
    const bullets = bulletsRaw
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.startsWith('•'));
    const tweet = tweetMatch ? tweetMatch[1].trim().slice(0, 280) : '';

    if (!bullets.length || !tweet) {
      return res.redirect(303, '/?error=' + encodeURIComponent('AI response was unexpected. Try again.'));
    }

    const params = new URLSearchParams({
      b1: bullets[0] || '',
      b2: bullets[1] || '',
      b3: bullets[2] || '',
      tweet,
    });
    res.redirect(303, '/result?' + params.toString());
  } catch (err) {
    console.error('Anthropic error:', err.message);
    const msg = err.status === 401
      ? 'Invalid API key — check ANTHROPIC_API_KEY.'
      : 'AI service error. Please try again.';
    res.redirect(303, '/?error=' + encodeURIComponent(msg));
  }
});

router.get('/result', (req, res) => {
  const { b1, b2, b3, tweet } = req.query;
  const bullets = [b1, b2, b3].filter(Boolean);

  if (!bullets.length) {
    return res.redirect(303, '/');
  }

  const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>QuickBrief — Results</title>
  <link rel="stylesheet" href="/styles.css"/>
</head>
<body>
  <header class="topbar">
    <span class="brand" style="color:var(--accent)">QuickBrief</span>
  </header>
  <div class="container">
    <div class="card">
      <h2>3-Bullet Summary</h2>
      <ul class="bullets">
        ${bullets.map(b => `<li>${esc(b.replace(/^•\s*/, ''))}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="card">
      <h2>Tweet Version</h2>
      <p class="tweet-text">${esc(tweet)}</p>
      <p class="char-count">${(tweet || '').length} / 280 characters</p>
      <button class="btn" onclick="navigator.clipboard.writeText(${JSON.stringify(tweet || '')}).then(()=>this.textContent='Copied!')">Copy Tweet</button>
    </div>
    <a href="/" class="btn secondary" style="margin-top:8px">Summarize another</a>
  </div>
</body>
</html>`);
});

module.exports = router;
