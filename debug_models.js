import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Using API Key:", apiKey.substring(0, 10) + "...");

    const modelsToTest = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];

    for (const modelName of modelsToTest) {
        console.log(`Testing ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ SUCCESS: ${modelName} works! Response:`, result.response.text().substring(0, 20));
        } catch (error) {
            console.error(`❌ FAILURE: ${modelName} failed. Error:`, error.message);
        }
    }
}

listModels();
