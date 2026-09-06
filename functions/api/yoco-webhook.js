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
                     html: `<h1>Awe ${name},</h1><p>Your payment for order <strong>#${orderId}</strong> was successful. We are packing your merch!</p>`
        })
    });
}
