const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateSuggestions(data) {
  const prompt = `
You are an expert SEO auditor. Provide clear, practical SEO improvement suggestions in bullet points based on the audit data below.

SEO Metadata:
${JSON.stringify(data.seoData, null, 2)}

Lighthouse SEO Summary:
${JSON.stringify(data.lighthouse?.categories?.seo || {}, null, 2)}

Do not add explanations—only actionable bullet points.
`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",  // Updated model name
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.3
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (err) {
    console.error("Gemini API Error:", err);
    
    // Enhanced error handling
    if (err.message.includes('404')) {
      return "Error: Invalid model or endpoint. Please check model name";
    }
    if (err.message.includes('API key')) {
      return "Error: Invalid API key. Check your .env file";
    }
    
    return "Error generating suggestions. Check console for details.";
  }
}

module.exports = generateSuggestions;