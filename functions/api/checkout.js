export async function onRequestPost(context) {
    const { env, request } = context;
    
    try {
        const body = await request.json();
        const { customerName, customerEmail, shippingAddress, cartItems } = body;
        
        // 🚨 CRITICAL DIAGNOSTIC CHECK: Stop errors from masking behind a vague alert
        if (!env.YOCO_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "Cloudflare cannot read your 'YOCO_SECRET_KEY' variable. Make sure it is saved in your Environment Variables dashboard panel." }), { status: 500 });
        }
        if (!env.DB) {
            return new Response(JSON.stringify({ error: "Cloudflare cannot find your 'DB' D1 Database binding. Make sure it is explicitly added under the Bindings panel tab." }), { status: 500 });
        }

        let totalCents = 0;
        for (const item of cartItems) {
            totalCents += item.price * item.quantity;
        }

        const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;

        // Save order to D1 Database
        await env.DB.prepare(
            "INSERT INTO orders (order_id, customer_name, customer_email, shipping_address, total_cents) VALUES (?, ?, ?, ?, ?)"
        ).bind(orderId, customerName, customerEmail, shippingAddress, totalCents).run();

        // Connect securely to Yoco Online Gateways
        const yocoResponse = await fetch("https://yoco.com", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.YOCO_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: totalCents,
                currency: "ZAR",
                successUrl: `https://pages.dev{orderId}`,
                cancelUrl: "https://pages.dev",
                metadata: { orderId: orderId }
            })
        });

        const yocoData = await yocoResponse.json();
        
        if (yocoData.redirectUrl) {
            return new Response(JSON.stringify({ redirectUrl: yocoData.redirectUrl }), {
                headers: { "Content-Type": "application/json" }
            });
        } else {
            return new Response(JSON.stringify({ error: `Yoco Refusal: ${JSON.stringify(yocoData)}` }), { status: 400 });
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: `System Processing Rejection: ${err.message}` }), { status: 500 });
    }
}
