/**
 * Test register flow
 * Run: npx dotenv-cli -e .env.local -- npx tsx src/lib/db/test-register.ts
 */

async function testRegister() {
  console.log("Testing register...");
  
  try {
    const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@autolyrics.local",
        password: "TestPassword123!",
      }),
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log("\n✅ Register SUCCESS!");
    } else {
      console.log("\n❌ Register FAILED!");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testRegister();
