// Test script for mileage calculation API
// Run with: node test-mileage-debug.js

const API_URL = 'http://localhost:3000/api/mileage/calculate';

const testCases = [
  {
    name: "String addresses test",
    payload: {
      origin: "Kuala Lumpur",
      destination: "Selangor",
      isRoundTrip: false
    }
  },
  {
    name: "Coordinate objects test",
    payload: {
      origin: { lat: 3.139, lng: 101.6869 },
      destination: { lat: 3.0738, lng: 101.5183 },
      isRoundTrip: false
    }
  },
  {
    name: "Round trip test",
    payload: {
      origin: "Petaling Jaya",
      destination: "Subang Jaya", 
      isRoundTrip: true
    }
  }
];

async function testMileageAPI() {
  console.log("🧪 Starting Mileage API Debug Tests...\n");
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log("Payload:", JSON.stringify(testCase.payload, null, 2));
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      const responseData = await response.text();
      console.log("Response:", responseData);
      
      if (response.ok) {
        console.log("✅ Test passed");
      } else {
        console.log("❌ Test failed");
      }
      
    } catch (error) {
      console.log("❌ Network error:", error.message);
    }
    
    console.log("─".repeat(50));
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testMileageAPI().catch(console.error);
}

module.exports = { testMileageAPI };