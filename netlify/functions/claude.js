const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { prompt, image } = body;
  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'prompt is required' }) };
  }

  try {
    const client = new Anthropic({ apiKey });

    const content = [];
    if (image && image.data) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType || 'image/jpeg',
          data: image.data,
        },
      });
    }
    content.push({ type: 'text', text: prompt });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    });

    const text = message.content.find(b => b.type === 'text')?.text ?? '';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    console.error('Anthropic error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'API call failed' }),
    };
  }
};
