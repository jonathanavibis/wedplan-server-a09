const API_BASE = 'https://wedplan-server-a09.vercel.app/api';

async function runFullAudit() {
  console.log('========================================================');
  console.log('🚀 STARTING COMPREHENSIVE WEDPLAN BACKEND & DATA AUDIT');
  console.log('API Target:', API_BASE);
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Health check
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    assert(res.ok && data.status === 'healthy', '1. Server Health Check (/api/health)');
  } catch (e) {
    assert(false, `1. Server Health Check: ${e.message}`);
  }

  // 2. Authentication Checks
  let adminToken = '';
  let vendorToken = '';
  let customerToken = '';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@wedplan.com', password: 'Admin@123456' }),
    });
    const data = await res.json();
    assert(data.success && data.token && data.user.role === 'Admin', '2. Admin Login & JWT Generation');
    adminToken = data.token;
  } catch (e) {
    assert(false, `2. Admin Login: ${e.message}`);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vendor@wedplan.com', password: 'Vendor@123456' }),
    });
    const data = await res.json();
    assert(data.success && data.token && data.user.role === 'Vendor', '3. Vendor Login & JWT Generation');
    vendorToken = data.token;
  } catch (e) {
    assert(false, `3. Vendor Login: ${e.message}`);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@wedplan.com', password: 'Customer@123456' }),
    });
    const data = await res.json();
    assert(data.success && data.token && data.user.role === 'Customer', '4. Customer Login & JWT Generation');
    customerToken = data.token;
  } catch (e) {
    assert(false, `4. Customer Login: ${e.message}`);
  }

  // 3. User Profile Sync (Frontend -> Backend -> DB -> Frontend)
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        name: 'Sophia Test Customer',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      }),
    });
    const data = await res.json();
    assert(data.success && data.user.name === 'Sophia Test Customer', '5. Customer Profile Update & DB Sync');

    // Verify GET /auth/me returns updated data to frontend
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const meData = await meRes.json();
    assert(meData.success && meData.user.name === 'Sophia Test Customer', '6. Auth Me Data Flow to Frontend');
  } catch (e) {
    assert(false, `5-6. Profile sync: ${e.message}`);
  }

  // 4. Services Flow (Approved public listing)
  let testServiceId = '';
  try {
    const res = await fetch(`${API_BASE}/services?status=Approved`);
    const data = await res.json();
    assert(data.success && Array.isArray(data.services) && data.services.length > 0, `7. Public Catalog Fetch (Found ${data.services?.length} services)`);
    if (data.services && data.services.length > 0) {
      testServiceId = data.services[0]._id;
    }
  } catch (e) {
    assert(false, `7. Services catalog: ${e.message}`);
  }

  // 5. Service Details with populated vendor
  try {
    const res = await fetch(`${API_BASE}/services/${testServiceId}`);
    const data = await res.json();
    assert(data.success && data.service && data.service.images.length > 0, `8. Service Details & Image Array for ${data.service?.serviceName?.slice(0, 30)}...`);
  } catch (e) {
    assert(false, `8. Service details: ${e.message}`);
  }

  // 6. Vendor Add Service Flow
  let createdServiceId = '';
  try {
    const newServicePayload = {
      serviceName: 'Audit Test Luxury Wedding Setup ' + Date.now(),
      category: 'Decoration & Florist',
      price: 3200,
      location: 'Manhattan, NY',
      description: 'Custom handcrafted flower arches, bridal aisle runner, and fairy light installation.',
      images: [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=80',
      ],
    };

    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify(newServicePayload),
    });
    const data = await res.json();
    if (data.success) {
      createdServiceId = data.service._id;
      assert(true, `9. Vendor Add Service (ID: ${createdServiceId})`);
    } else {
      // Free limit might be reached if vendor has 3 active services
      assert(data.code === 'SUBSCRIPTION_LIMIT_REACHED' || data.success, `9. Vendor Add Service / Limit Check: ${data.message}`);
    }
  } catch (e) {
    assert(false, `9. Vendor Add Service: ${e.message}`);
  }

  // 7. Booking Cycle (Customer Request -> Vendor Receive -> Customer Status)
  let testBookingId = '';
  try {
    const randomDays = Math.floor(Math.random() * 500) + 30;
    const futureDate = new Date(Date.now() + randomDays * 86400000).toISOString().split('T')[0];

    const bookingPayload = {
      serviceId: testServiceId,
      eventDate: futureDate,
      eventLocation: 'Grand Plaza Ballroom, NY',
      message: 'Looking forward to celebrating our wedding with your team!',
    };

    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(bookingPayload),
    });
    const data = await res.json();
    if (data.success && data.booking) {
      testBookingId = data.booking._id;
      assert(true, `10. Customer Create Booking Request (${futureDate})`);
    } else {
      assert(false, `10. Customer Create Booking Request: ${data.message}`);
    }

    // Verify Customer Bookings
    const custRes = await fetch(`${API_BASE}/bookings/customer/my-bookings`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const custData = await custRes.json();
    assert(custData.success && Array.isArray(custData.bookings) && custData.bookings.length > 0, `11. Customer Bookings List Retrieval (Found ${custData.bookings?.length} bookings)`);
  } catch (e) {
    assert(false, `10-11. Booking creation: ${e.message}`);
  }

  // 8. Subscription Checkout Session Tests (Monthly & Yearly)
  try {
    // Vendor Monthly
    const resVM = await fetch(`${API_BASE}/transactions/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({ plan: 'premium', interval: 'monthly' }),
    });
    const dataVM = await resVM.json();
    assert(dataVM.success && dataVM.amount === 9 && dataVM.interval === 'monthly', '12. Vendor Premium Monthly Session ($9/mo)');

    // Vendor Yearly
    const resVY = await fetch(`${API_BASE}/transactions/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({ plan: 'vip', interval: 'yearly' }),
    });
    const dataVY = await resVY.json();
    assert(dataVY.success && dataVY.amount === 99 && dataVY.interval === 'yearly', '13. Vendor VIP Yearly Session ($99/yr)');

    // Customer Monthly
    const resCM = await fetch(`${API_BASE}/transactions/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ plan: 'premium', interval: 'monthly' }),
    });
    const dataCM = await resCM.json();
    assert(dataCM.success && dataCM.amount === 5 && dataCM.interval === 'monthly', '14. Customer Premium Monthly Session ($5/mo)');

    // Customer Yearly
    const resCY = await fetch(`${API_BASE}/transactions/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ plan: 'vip', interval: 'yearly' }),
    });
    const dataCY = await resCY.json();
    assert(dataCY.success && dataCY.amount === 79 && dataCY.interval === 'yearly', '15. Customer VIP Yearly Session ($79/yr)');
  } catch (e) {
    assert(false, `12-15. Subscription checkout sessions: ${e.message}`);
  }

  // 9. Admin Stats & Analytics Flow
  try {
    const res = await fetch(`${API_BASE}/users/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    assert(data.success && typeof data.totalUsers === 'number' && typeof data.totalServices === 'number', `16. Admin KPI Analytics (Users: ${data.totalUsers}, Services: ${data.totalServices}, Revenue: $${data.totalRevenue || 0})`);
  } catch (e) {
    assert(false, `16. Admin stats: ${e.message}`);
  }

  // 10. Clean up test created service if created
  if (createdServiceId) {
    try {
      await fetch(`${API_BASE}/services/${createdServiceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${vendorToken}` },
      });
      console.log('🧹 Cleaned up temporary test service.');
    } catch {}
  }

  console.log('\n========================================================');
  console.log(`📊 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');
}

runFullAudit().catch(console.error);
