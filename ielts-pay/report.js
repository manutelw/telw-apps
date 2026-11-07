'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const status = (text, error = false) => { $('status').textContent = text; $('status').className = 'status' + (error ? ' error' : ''); };
  const params = new URLSearchParams(location.search);
  if (['payment', 'reading', 'listening', 'writing'].includes(params.get('test'))) $('test').value = params.get('test');
  if (params.get('ref')) $('paymentRef').value = params.get('ref').slice(0, 60);
  $('reportForm').addEventListener('submit', async event => {
    event.preventDefault();
    const body = {email: $('email').value.trim(), test: $('test').value, paymentRef: $('paymentRef').value.trim(), message: $('message').value.trim()};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return status('Enter the email address you used for the test.', true);
    if (!body.test) return status('Choose what the problem is about.', true);
    if (body.message.length < 10) return status('Please describe what happened.', true);
    $('send').disabled = true; status('Sending...');
    try {
      const response = await fetch('/api/ielts/pay/report', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The report could not be sent. Please try again.');
      $('ref').textContent = data.reference; $('reportForm').hidden = true; $('done').hidden = false;
    } catch (error) { $('send').disabled = false; status(error.message, true); }
  });
})();
