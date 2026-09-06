export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { cart, customerName, customerEmail, shippingAddress } = body;

    // Fetch products from D1 to calculate secure server-side total
    const { results: products } = await env.DB.prepare('SELECT * FROM products').all();
    
    let totalCents = 0;
    const orderItems = [];

    for (const cartItem of cart) {
      const product = products.find(p => p.id === cartItem.id);
      if (!product) {
        throw new Error(`Product not found: ${cartItem.id}`);
      }
      totalCents += product.price_cents * cartItem.quantity;
      orderItems.push({
        product_id: product.id,
        quantity: cartItem.quantity,
        price_cents: product.price_cents
      });
    }

    // Generate Unique Order String
    const orderId = `TL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert order as pending
    await env.DB.prepare(
      'INSERT INTO orders (order_id, customer_name, customer_email, shipping_address, total_cents) VALUES (?, ?, ?, ?, ?)'
    ).bind(orderId, customerName, customerEmail, shippingAddress, totalCents).run();

    // Insert order items
    for (const item of orderItems) {
      await env.DB.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price_cents) VALUES (?, ?, ?, ?)'
      ).bind(orderId, item.product_id, item.quantity, item.price_cents).run();
    }

    // POST to Yoco Online Checkouts API
    const yocoResponse = await fetch('https://payment.yoco.com/v1/checkout/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.YOCO_SECRET_KEY}`
      },
      body: JSON.stringify({
        amount: totalCents,
        currency: 'ZAR',
        successUrl: `https://touchlinetruth.com/thank-you.html?orderId=${orderId}`,
        cancelUrl: `https://touchlinetruth.com/`,
        metadata: {
          orderId: orderId
        }
      })
    });

    if (!yocoResponse.ok) {
      const err = await yocoResponse.text();
      throw new Error('Yoco API Error: ' + err);
    }

    const yocoData = await yocoResponse.json();

    // Return the unique redirect URL to the client
    return new Response(JSON.stringify({ redirectUrl: yocoData.redirectUrl }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
