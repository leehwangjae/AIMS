export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(200).json({ ok: false, message: 'OPENAI_API_KEY is not configured.' });

    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ ok: false, message: 'prompt is required.' });

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt,
        size: '1024x1536',
        quality: 'medium'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({ ok: false, message: `Image API error: ${response.status}`, detail: errorText.slice(0, 500) });
    }

    const data = await response.json();
    const image = data.data?.[0] || {};
    const imageData = image.b64_json ? `data:image/png;base64,${image.b64_json}` : image.url;

    return res.status(200).json({ ok: true, image: imageData });
  } catch (error) {
    return res.status(200).json({ ok: false, message: error?.message || 'Unknown image generation error' });
  }
}
