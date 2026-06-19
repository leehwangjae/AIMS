export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ ok: false, message: 'prompt is required.' });

    if (process.env.GEMINI_API_KEY) {
      const geminiResult = await generateWithGemini(prompt);
      if (geminiResult.ok) return res.status(200).json(geminiResult);
      if (!process.env.OPENAI_API_KEY) return res.status(200).json(geminiResult);
    }

    if (process.env.OPENAI_API_KEY) {
      const openaiResult = await generateWithOpenAI(prompt);
      return res.status(200).json(openaiResult);
    }

    return res.status(200).json({ ok: false, message: 'GEMINI_API_KEY or OPENAI_API_KEY is not configured.' });
  } catch (error) {
    return res.status(200).json({ ok: false, message: error?.message || 'Unknown image generation error' });
  }
}

async function generateWithGemini(prompt) {
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false,
      provider: 'gemini',
      message: `Gemini Image API error: ${response.status}`,
      detail: errorText.slice(0, 700)
    };
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(part => part.inlineData?.data || part.inline_data?.data);
  const inlineData = imagePart?.inlineData || imagePart?.inline_data;

  if (!inlineData?.data) {
    return {
      ok: false,
      provider: 'gemini',
      message: 'Gemini response did not include image data.',
      detail: JSON.stringify(data).slice(0, 700)
    };
  }

  const mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png';
  return {
    ok: true,
    provider: 'gemini',
    model,
    image: `data:${mimeType};base64,${inlineData.data}`
  };
}

async function generateWithOpenAI(prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
    return { ok: false, provider: 'openai', message: `OpenAI Image API error: ${response.status}`, detail: errorText.slice(0, 700) };
  }

  const data = await response.json();
  const image = data.data?.[0] || {};
  const imageData = image.b64_json ? `data:image/png;base64,${image.b64_json}` : image.url;
  return { ok: true, provider: 'openai', model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', image: imageData };
}
