const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('1. Logging in user...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@test.com',
      password: '123456',
    });
    const token = loginRes.data.token;
    console.log('Logged in successfully.');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n2. Fetching streak info...');
    const streakRes = await axios.get(`${API_URL}/study-plan/streak`, { headers });
    console.log('Streak response data:', streakRes.data);

    console.log('\n3. Fetching heatmap info...');
    const heatmapRes = await axios.get(`${API_URL}/study-plan/heatmap`, { headers });
    console.log('Heatmap response data (number of items):', heatmapRes.data.heatmap?.length);
    if (heatmapRes.data.heatmap?.length > 0) {
      console.log('First heatmap item:', heatmapRes.data.heatmap[0]);
    }

    console.log('\n✅ Stats fetched successfully with real data!');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}

test();
