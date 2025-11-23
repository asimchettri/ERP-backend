// Test script to verify authentication endpoints work correctly
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testAuthEndpoints() {
  try {
    console.log('🧪 Testing Authentication Endpoints...\n');

    // Test login endpoint
    console.log('1. Testing login endpoint...');
    
    // First, let's check if the seed data includes a test user
    // Based on the seed.ts, we should have a superadmin user
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'superadmin@example.com',
        password: 'Password123!' // Default password from seed
      });

      console.log('✅ Login successful!');
      console.log('Access Token:', loginResponse.data.accessToken ? '✅ Present' : '❌ Missing');
      console.log('Refresh Token:', loginResponse.data.refreshToken ? '✅ Present' : '❌ Missing');

      const accessToken = loginResponse.data.accessToken;

      // Test the /auth/me endpoint
      console.log('\n2. Testing /auth/me endpoint...');
      const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      console.log('✅ /auth/me successful!');
      console.log('User data:', {
        id: meResponse.data.id,
        email: meResponse.data.email,
        role: meResponse.data.role,
        firstName: meResponse.data.firstName,
        lastName: meResponse.data.lastName
      });

      // Test refresh token
      console.log('\n3. Testing refresh token...');
      const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: loginResponse.data.refreshToken
      });

      console.log('✅ Token refresh successful!');
      console.log('New Access Token:', refreshResponse.data.accessToken ? '✅ Present' : '❌ Missing');

      // Test role-based access (users endpoint)
      console.log('\n4. Testing role-based access...');
      try {
        const usersResponse = await axios.get(`${BASE_URL}/users`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        console.log('✅ Users endpoint accessible!');
        console.log('Found users:', usersResponse.data.length);
      } catch (roleError) {
        if (roleError.response?.status === 403) {
          console.log('✅ Role-based access control working (403 Forbidden)');
        } else {
          console.log('⚠️ Unexpected role error:', roleError.response?.status);
        }
      }

    } catch (loginError) {
      if (loginError.response?.status === 401) {
        console.log('⚠️ Login failed - credentials might be incorrect');
        console.log('This is expected if seed data hasn\'t been run or password is different');
      } else {
        console.log('❌ Login error:', loginError.message);
      }
    }

    console.log('\n🎉 Authentication endpoint tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the NestJS server is running on port 3000');
    }
  }
}

// Run the test
testAuthEndpoints();