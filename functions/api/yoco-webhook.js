export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    // Webhook listener strictly for successful payments
    if (body.type === 'checkout.paid') {
      const orderId = body.payload.metadata.orderId;
      
      // Update DB order status
      await env.DB.prepare(
        "UPDATE orders SET payment_status = 'paid' WHERE order_id = ?"
      ).bind(orderId).run();

      // Retrieve customer info for the email receipt
      const order = await env.DB.prepare(
        "SELECT customer_email, customer_name FROM orders WHERE order_id = ?"
      ).bind(orderId).first();

      if (order) {
        // Compose Premium HTML Receipt
        const emailHtml = `
          <div style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 8px;">
            <h1 style="color: #D4AF37; font-size: 24px; text-transform: uppercase;">Awe, ${order.customer_name}!</h1>
            <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
              Your payment for order <strong style="color: #D4AF37;">${orderId}</strong> was entirely successful.
            </p>
            <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
              The Touchline Truth team is packing your gear securely. You will receive a tracking link once your shipment leaves our facility.
            </p>
            <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-top: 30px;">
              Stay True.<br/>
              <strong style="color: #D4AF37;">Touchline Truth Store</strong>
            </p>
          </div>
