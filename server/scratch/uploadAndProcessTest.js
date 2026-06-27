const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('1. Registering user...');
    let token;
    try {
      const regRes = await axios.post(`${API_URL}/auth/register`, {
        name: 'Test User',
        email: 'test@test.com',
        password: '123456',
      });
      token = regRes.data.token;
      console.log('Registered successfully.');
    } catch (e) {
      console.log('Registration failed (might already exist), attempting login...');
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'test@test.com',
        password: '123456',
      });
      token = loginRes.data.token;
      console.log('Logged in successfully.');
    }

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n2. Uploading sample.pdf...');
    const form = new FormData();
    const filePath = path.join(__dirname, '../../sample.pdf');
    form.append('file', fs.createReadStream(filePath));

    const uploadRes = await axios.post(`${API_URL}/documents/upload`, form, {
      headers: {
        ...headers,
        ...form.getHeaders(),
      },
    });

    const docId = uploadRes.data.document.id;
    console.log(`Uploaded. Document ID: ${docId}. Title: ${uploadRes.data.document.title}`);

    console.log('\n3. Polling document status until ready...');
    let docStatus = 'processing';
    let docData = null;

    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const getRes = await axios.get(`${API_URL}/documents/${docId}`, { headers });
      docData = getRes.data.document;
      docStatus = docData.status;
      console.log(`[Poll ${i+1}] Status: ${docStatus} - Chunks: ${docData.chunkCount || 0} - Pages: ${docData.pageCount || 0}`);

      if (docStatus === 'ready' || docStatus === 'error') {
        break;
      }
    }

    if (docStatus === 'ready') {
      console.log('\n✅ Document processed successfully!');
      console.log('Summary:\n', docData.summary);
    } else {
      console.error('\n❌ Document processing failed or timed out:', docData.errorMessage || 'Unknown error');
    }
  } catch (err) {
    console.error('Error during test:', err.response?.data || err.message);
  }
}

test();
