// Test script to verify Gemini API integration
// Run this with: node src/test-gemini-api.js

require('dotenv').config();

const testGeminiAPI = async () => {
  console.log('🧪 Testing Gemini API integration...');
  
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ REACT_APP_GEMINI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  
  const payload = {
    contents: [{
      parts: [{
        text: "Hello! Can you respond with a simple greeting?"
      }]
    }]
  };
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  
  try {
    console.log('📡 Making request to Gemini API...');
    console.log('🔗 URL:', apiUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ API Response:', JSON.stringify(result, null, 2));
    
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('🤖 AI Response:', result.candidates[0].content.parts[0].text);
      console.log('✅ Gemini API integration is working correctly!');
    } else {
      console.error('❌ Unexpected response structure:', result);
    }
    
  } catch (error) {
    console.error('❌ Error testing Gemini API:', error);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testGeminiAPI();
}

module.exports = { testGeminiAPI };
