// smoke test: start the server first (npm start in api/), then run: node test.mjs
fetch('http://localhost:4200/api', {
  method: 'post',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Sender',
    email: 'test@example.com',
    business: 'Test Business',
    message: 'Testing the Morelia Media contact form backend',
    website: ''
  })
}).then(response => response.json()).then(data => { console.log(data) })
