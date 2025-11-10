import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// ✅ Ensure API Key exists
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generatePost = async (req, res) => {
    const { title, linkedin } = req.body;

    console.log("Received title:", title, "and linkedin:", linkedin);

    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }

    let content = "";
    let finalPlatform = "";

    try {
        // ✅ Determine the target platform
        const platform = linkedin ? linkedin.toLowerCase() : "linkedin";
        const effectivePlatform =
            platform === "x"
                ? "X (Twitter)"
                : platform.charAt(0).toUpperCase() + platform.slice(1);

        finalPlatform = effectivePlatform;

        // ✅ Prepare AI prompt
                const prompt = `
            You are an expert social media content strategist and copywriter. 
            Your job is to generate a high-performing post specifically optimized for ${effectivePlatform}.

            ### Input:
            Title: "${title}"

            ### Requirements:
            - Write in a professional, engaging, and confident tone.
            - Keep the post concise but impactful (2–4 short paragraphs or 3–5 lines).
            - Start with a strong hook that grabs attention.
            - Add relevant context to expand the title into a meaningful post.
            - Use emojis to enhance clarity and engagement (not too many).
            - Include 3–5 highly relevant, platform-appropriate hashtags.
            - Make sure hashtags match the topic and audience size.
            - Remove any generic phrases like “Here is your post” or "Certainly".
            - Do NOT include explanations, disclaimers, or formatting outside the post itself.
            - Output ONLY the final post text.

            ### Goal:
            Create a post that is:
            - Scroll-stopping
            - Authentic
            - Valuable
            - Shareable
            - Suitable for real-world posting on ${effectivePlatform}

            Generate ONLY the final post. No quotes, no headings, no explanations.
            `;


        // ✅ Call Gemini API
        const result = await model.generateContent(prompt);
          console.log("Gemini API response:", JSON.stringify(result, null, 2));
        // ✅ Extract Gemini text SAFELY
        const generated =
            result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generated) {
            console.log("⚠️ Gemini returned no text:", JSON.stringify(result, null, 2));
            throw new Error("Gemini returned empty content.");
        }

        content = generated.trim();

        // ✅ Return final response
        return res.status(200).json({
            success: true,
            generated_for_platform: finalPlatform,
            post_content: content,
        });

    } catch (error) {
        console.error("Error processing post generation request:", error);
        return res.status(500).json({
            error: "Internal Server Error during content creation.",
            message: error.message,
        });
    }
};
