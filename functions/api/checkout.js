export async function onRequestPost(context) {
    const { env, request } = context;
    
    try {
        const body = await request.json();
        const { customerName, customerEmail, shippingAddress, cartItems } = body;
        
        if (!env.YOCO_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "Missing YOCO_SECRET_KEY in Cloudflare settings." }), { status: 500 });
        }

        let totalCents = 0;
        for (const item of cartItems) {
            totalCents += item.price * item.quantity;
        }

        const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;

        // Optional Database Sync
        try {
            if (env.DB) {
                await env.DB.prepare(
                    "INSERT INTO orders (order_id, customer_name, customer_email, shipping_address, total_cents) VALUES (?, ?, ?, ?, ?)"
                ).bind(orderId, customerName, customerEmail, shippingAddress, totalCents).run();
            }
        } catch (dbError) {
            console.log("Database write bypassed:", dbError.message);
        }

        const cleanSecretKey = env.YOCO_SECRET_KEY.trim();

        // 🚀 UPDATED YOCO OFFICIAL GATEWAY ENDPOINT ENGINE
        const yocoResponse = await fetch("https://yoco.com", {
            method: "POST",
            headers: {
                "X-Auth-Secret-Key": cleanSecretKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: totalCents,
                currency: "ZAR",
                successUrl: `https://${request.headers.get("host")}/thank-you.html?orderId=${orderId}`,
                cancelUrl: `https://${request.headers.get("host")}/`,
                metadata: { orderId: orderId }
            })
        });

        const responseText = await yocoResponse.text();
        
        let yocoData;
        try {
            yocoData = JSON.parse(responseText);
        } catch (parseError) {
            return new Response(JSON.stringify({ error: `Yoco endpoint structural failure. Server raw reply: ${responseText.substring(0, 120)}` }), { status: 500 });
        }
        
        // Handle redirect extraction logic based on Yoco structure variants
        const redirectUrl = yocoData.redirectUrl || (yocoData.body && yocoData.body.redirectUrl);

        if (redirectUrl) {
            return new Response(JSON.stringify({ redirectUrl: redirectUrl }), {
                headers: { "Content-Type": "application/json" }
            });
        } else {
            return new Response(JSON.stringify({ error: `Yoco Rejection Reply: ${yocoData.displayMessage || yocoData.message || responseText.substring(0, 100)}` }), { status: 400 });
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: `System Processing Rejection: ${err.message}` }), { status: 500 });
    }
}
