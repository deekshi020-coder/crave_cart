// Verification test script
async function runTests() {
  const baseUrl = 'http://127.0.0.1:3000';
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  try {
    // 1. Test Divya Login
    const divyaLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'divya@cravecart.com', password: 'Divya@123' })
    });
    const divyaAuth = await divyaLoginRes.json();
    assert(divyaAuth.token && divyaAuth.user?.name === 'Divya Sundaram', 'Divya authentication succeeds with authentic bcrypt hash');

    // 2. Test Divya initial orders and loyalty tier
    const divyaLoyaltyRes = await fetch(`${baseUrl}/api/profile/loyalty`, {
      headers: { Authorization: `Bearer ${divyaAuth.token}` }
    });
    const divyaLoyalty = await divyaLoyaltyRes.json();
    assert(divyaLoyalty.loyalty.eligibleOrders === 2, `Divya initial qualifying orders count is 2 (got ${divyaLoyalty.loyalty.eligibleOrders})`);
    assert(divyaLoyalty.loyalty.discountPercentage === 0, `Divya initial discount is 0% (Member) before 3rd order (got ${divyaLoyalty.loyalty.discountPercentage}%)`);

    // 3. Test WELCOME100 rejection for Divya (since she already has 2 orders)
    // Add item to Divya's cart
    await fetch(`${baseUrl}/api/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${divyaAuth.token}` },
      body: JSON.stringify({ menuItemId: 1, quantity: 2 }) // Biryani item (₹380 x 2 = ₹760)
    });

    const welcome100Try = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${divyaAuth.token}` },
      body: JSON.stringify({
        addressText: 'Flat 3B, Ceebros Anand, Anna Nagar, Chennai',
        couponCode: 'WELCOME100',
        paymentMethod: 'UPI'
      })
    });
    const welcome100Res = await welcome100Try.json();
    assert(welcome100Try.status === 400 && welcome100Res.error?.includes('first'), 'WELCOME100 rejected for existing customer with prior orders');

    // 4. Test BIRYANI100 acceptance on Biryani item
    const biryaniOrderTry = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${divyaAuth.token}` },
      body: JSON.stringify({
        addressText: 'Flat 3B, Ceebros Anand, Anna Nagar, Chennai',
        couponCode: 'BIRYANI100',
        paymentMethod: 'Cash on Delivery'
      })
    });
    const biryaniOrderRes = await biryaniOrderTry.json();
    assert(biryaniOrderTry.status === 201 && biryaniOrderRes.couponDiscount === 100, `BIRYANI100 applied successfully on Biryani items (discount: ₹${biryaniOrderRes.couponDiscount})`);
    assert(biryaniOrderRes.orderId > 0, `Order placed successfully with ID: ${biryaniOrderRes.orderId}`);

    // 5. Verify Divya's 3rd order transitioned her to Gold Tier (10% discount)
    const updatedLoyaltyRes = await fetch(`${baseUrl}/api/profile/loyalty`, {
      headers: { Authorization: `Bearer ${divyaAuth.token}` }
    });
    const updatedLoyalty = await updatedLoyaltyRes.json();
    assert(updatedLoyalty.loyalty.eligibleOrders === 3, `Divya order count increased to 3 (got ${updatedLoyalty.loyalty.eligibleOrders})`);
    assert(updatedLoyalty.loyalty.discountPercentage === 10, `Divya unlocked 10% Gold tier discount! (got ${updatedLoyalty.loyalty.discountPercentage}%)`);

    // 6. Test Delivery Partner (Vikram) cash confirmation on COD order
    const vikramLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vikram@cravecart.com', password: 'Agent@123' })
    });
    const vikramAuth = await vikramLogin.json();
    assert(vikramAuth.token && vikramAuth.user?.role === 'delivery_agent', 'Vikram delivery partner authentication succeeds');

    const cashConfirmRes = await fetch(`${baseUrl}/api/delivery/orders/${biryaniOrderRes.orderId}/confirm-cash`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${vikramAuth.token}` }
    });
    assert(cashConfirmRes.status === 200, 'Cash collection confirmation recorded successfully by delivery partner');

    // 7. Verify Aarav demo customer (has 6 orders -> 20% Platinum)
    const aaravLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aarav@example.com', password: 'Customer@123' })
    });
    const aaravAuth = await aaravLogin.json();
    const aaravLoyalty = await (await fetch(`${baseUrl}/api/profile/loyalty`, {
      headers: { Authorization: `Bearer ${aaravAuth.token}` }
    })).json();
    assert(aaravLoyalty.loyalty.eligibleOrders >= 6, `Aarav has 6+ qualifying orders (got ${aaravLoyalty.loyalty.eligibleOrders})`);
    assert(aaravLoyalty.loyalty.discountPercentage === 20, `Aarav is in 20% Platinum tier`);

    // 8. Test Chennai Catalog
    const restRes = await (await fetch(`${baseUrl}/api/restaurants`)).json();
    assert(restRes.restaurants.length >= 30, `Catalog contains 30+ distinct restaurants (got ${restRes.restaurants.length})`);
    const chennaiOnly = restRes.restaurants.every(r => r.city === 'Chennai');
    assert(chennaiOnly, 'All seeded restaurants belong to Chennai, Tamil Nadu');

    console.log(`\n========================================`);
    console.log(`SUMMARY: ${passed} / ${total} tests PASSED.`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
