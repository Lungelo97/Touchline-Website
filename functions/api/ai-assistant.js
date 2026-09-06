export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { messages } = await request.json();

    const systemInstruction = "You are the official AI chat companion for South African artist Touchline. Respond using engaging, street-smart South African hip-hop dialogue. Help fans with his lyrics, album catalog, or merch tracking. Use some South African slang naturally (like 'Awe', 'Sho', 'Grootman'). Keep responses concise and helpful.";

    // Connect to Google Gemini API
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    
    // Map standard UI roles to Gemini roles
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: contents
    };

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('Gemini API Error: ' + err);
    }

    const data = await response.json();
    
    // Extract the text prediction from the Gemini array response
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text 
      || "Sorry my outi, I'm having trouble connecting right now.";

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
