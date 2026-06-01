const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

function parseSummaryResponse(raw) {
  const bulletsMatch = raw.match(/BULLETS:\n((?:•[^\n]+\n?){1,3})/);
  const tweetMatch = raw.match(/TWEET:\n(.+)/s);
  const bulletsRaw = bulletsMatch ? bulletsMatch[1].trim() : '';
  const bullets = bulletsRaw.split('\n').map(b => b.trim()).filter(b => b.startsWith('•'));
  const tweet = tweetMatch ? tweetMatch[1].trim().slice(0, 280) : '';
  return { bullets, tweet };
}

describe('parseSummaryResponse', () => {
  it('parses valid response', () => {
    const raw = `BULLETS:\n• First point here\n• Second point here\n• Third point here\n\nTWEET:\nThis is the tweet text.`;
    const { bullets, tweet } = parseSummaryResponse(raw);
    assert.equal(bullets.length, 3);
    assert.equal(tweet, 'This is the tweet text.');
  });

  it('truncates tweet to 280 chars', () => {
    const long = 'x'.repeat(300);
    const raw = `BULLETS:\n• a\n• b\n• c\n\nTWEET:\n${long}`;
    const { tweet } = parseSummaryResponse(raw);
    assert.equal(tweet.length, 280);
  });

  it('returns empty on malformed response', () => {
    const { bullets, tweet } = parseSummaryResponse('garbage');
    assert.equal(bullets.length, 0);
    assert.equal(tweet, '');
  });
});
