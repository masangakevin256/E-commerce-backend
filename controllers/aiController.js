import axios from "axios";

export const testAIConfig = async (req, res) => {
  const hfKey = process.env.HUGGING_FACE_API_KEYS;

  res.json({
    status: "AI backend active (HF Router)",
    hf_key_configured: !!hfKey,
    node_version: process.version
  });
};

export const askAI = async (req, res) => {
  const { message, history = [] } = req.body;
  const hfKey = process.env.HUGGING_FACE_API_KEYS;

  if (!hfKey) {
    return res.status(500).json({
      error: "Hugging Face API key missing"
    });
  }

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

const systemPrompt = `
You are a helpful assistant for "KuStore E-commerce" at Kisii University.

Rules:
- Answer only KuStore-related questions.
- Delivery: 2–4 hours within campus (KES 50).
- Payments: M-Pesa or Cash on Delivery.
- Be short, friendly, and clear.
`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content
    })),
    { role: "user", content: message }
  ];

  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages,
        temperature: 0.7,
        max_tokens: 400
      },
      {
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const aiResponse =
      response.data?.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("Empty AI response");
    }

    res.json({ response: aiResponse.trim() });

  } catch (error) {
    console.error(
      "AI Router Error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "AI service unavailable. Try again later."
    });
  }
};
