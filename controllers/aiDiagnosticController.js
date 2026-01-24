export const testAIConfig = async (req, res) => {
    try {
        const hasKey = !!process.env.HUGGING_FACE_API_KEYS;
        const keyPrefix = hasKey ? `${process.env.HUGGING_FACE_API_KEYS.substring(0, 5)}...` : "none";

        res.json({
            status: "Backend AI is active (Hugging Face Chat)",
            hf_key_configured: hasKey,
            key_prefix: keyPrefix,
            node_version: process.version,
            env_loaded: !!process.env.ACCESS_TOKEN_SECRET
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
