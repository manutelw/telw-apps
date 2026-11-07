'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const API = '/api/ielts/pay/';
  const TESTS = {reading: ['Reading', '/ielts/reading/'], listening: ['Listening', '/ielts/listening/'], writing: ['Writing', '/ielts/writing/']};
  const SKILLS = {bundle: ['reading', 'listening', 'writing'], writing: ['writing'], reading: ['reading'], listening: ['listening']};
  const status = (text, error = false) => { $('status').textContent = text; $('status').className = 'status' + (error ? ' error' : ''); };
  const chosen = new URLSearchParams(location.search).get('test');
  if (SKILLS[chosen]) document.querySelector(`input[name=product][value=${chosen}]`).checked = true;

  async function post(action, body) {
    const response = await fetch(API + action, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }

  function finished(email, product) {
    $('payForm').hidden = true; $('done').hidden = false;
    $('doneText').textContent = `Your payment is confirmed for ${email}. Open your test and verify this email address to begin.`;
    for (const skill of SKILLS[product] || []) {
      const link = document.createElement('a'); link.className = 'go';
      link.href = TESTS[skill][1]; link.textContent = 'Start ' + TESTS[skill][0];
      $('doneLinks').append(link);
    }
    $('done').scrollIntoView({behavior: 'smooth'});
  }

  fetch(API + 'config').then(r => r.json()).then(config => {
    if (!config.ready) { $('payButton').disabled = true; status('Online payment opens soon. To buy now, contact TELW using the details below.'); }
  }).catch(() => {});

  $('payForm').addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('email').value.trim().toLowerCase(), again = $('email2').value.trim().toLowerCase();
    const product = document.querySelector('input[name=product]:checked')?.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return status('Enter a valid email address.', true);
    if (email !== again) return status('The two email addresses do not match.', true);
    if (!$('agree').checked) return status('Please agree to the Terms and the Refund Policy.', true);
    if (typeof Razorpay !== 'function') return status('The payment window could not load. Check your connection and reload the page.', true);
    $('payButton').disabled = true; status('Opening the payment window...');
    try {
      const order = await post('order', {email, product});
      const checkout = new Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: 'TELW The English Workshop', description: order.name,
        prefill: {email: order.email}, notes: {product: order.product}, theme: {color: '#13233f'},
        handler: async result => {
          status('Confirming your payment...');
          try {
            const done = await post('verify', {orderId: result.razorpay_order_id, paymentId: result.razorpay_payment_id, signature: result.razorpay_signature});
            finished(done.email, done.product);
          } catch (error) {
            status(error.message + ' Your payment reference is ' + result.razorpay_payment_id + '.', true);
          }
        },
        modal: {ondismiss: () => { $('payButton').disabled = false; status('Payment was not completed. You have not been charged.'); }}
      });
      checkout.on('payment.failed', response => { $('payButton').disabled = false; status('Payment failed: ' + (response.error?.description || 'please try again.'), true); });
      checkout.open();
    } catch (error) {
      $('payButton').disabled = false; status(error.message, true);
    }
  });
})();
