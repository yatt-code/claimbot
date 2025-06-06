// Simple Node.js script to test salary submission
const fetch = require('node-fetch');

async function testSalarySubmission() {
  try {
    console.log('Testing salary submission...');
    
    // Test with the first user we saw in the debug data: aiyad.zamir@gmail.com
    const response = await fetch('http://localhost:3000/api/users/salary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, this would need proper authentication
        'Authorization': 'Bearer your-auth-token'
      },
      body: JSON.stringify({
        monthlySalary: 5000,
        hourlyRate: 28.9
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Salary submission successful:', result);
    } else {
      console.log('❌ Salary submission failed:', response.status, await response.text());
    }

  } catch (error) {
    console.error('Error testing salary submission:', error.message);
  }
}

testSalarySubmission();