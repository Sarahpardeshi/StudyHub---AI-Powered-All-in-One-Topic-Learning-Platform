import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ No API Key found in environment variables!");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`🔍 Checking available models for API Key ending in '...${apiKey.slice(-4)}'`);

try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error("❌ API returned an error:");
        console.error(JSON.stringify(data.error, null, 2));
    } else {
        console.log("✅ API Connection Successful. Available Models for generateContent:");
        if (data.models) {
            const contentModels = data.models.filter(m =>
                m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
            );

            if (contentModels.length === 0) {
                console.log("⚠️ No models support 'generateContent'. Listing ALL models:");
                data.models.forEach(m => console.log(`- ${m.name}`));
            } else {
                contentModels.forEach(m => {
                    console.log(`- ${m.name.replace('models/', '')}`);
                });
            }
        } else {
            console.log("⚠️ No models listed in response.");
        }
    }
} catch (e) {
    console.error("❌ Network/Fetch Error:", e);
}
