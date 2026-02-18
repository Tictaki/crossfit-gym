import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/members',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Member list count:', parsed.members?.length);
      console.log('Pagination info:', JSON.stringify(parsed.pagination, null, 2));
      if (parsed.members && parsed.members.length > 0) {
        console.log('First member name:', parsed.members[0].name);
      } else {
        console.log('No members returned in array');
      }
    } catch (e) {
      console.log('Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.end();
