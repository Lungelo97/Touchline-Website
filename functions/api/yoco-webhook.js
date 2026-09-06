export async function onRequestPost(context) {
    const { env, request } = context;
    
    try {
        const payload = await request.json();

        if (payload.type === 'checkout.paid') {
            const orderId = payload.object.metadata.orderId;

            // 1. Mark order status as paid in D1 database
            await env.DB.prepare(
                "UPDATE orders SET payment_status = 'paid' WHERE order_id = ?"
            ).bind(orderId).run();

            // 2. Query customer details to trigger notifications
            const order = await env.DB.prepare(
                "SELECT customer_name, customer_email FROM orders WHERE order_id = ?"
            ).bind(orderId).first();

            // 3. Chain automation workflow: Dispatch receipt email
            await fetch("https://resend.com", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: "Touchline Orders <orders@touchlinetruth.com>",
                    to: order.customer_email,
                    subject: `Payment Confirmed - Order #${orderId}`,
                    html: `<h1>Awe ${order.customer_name},</h1><p>Your payment for order <strong>#${orderId}</strong> was successful. We are packing your merch!</p>`
                })
            });
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
