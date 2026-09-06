export async function onRequestPost(context) {
    const { env, request } = context;
    
    try {
        const body = await request.json();
        const { customerName, customerEmail, shippingAddress, cartItems } = body;
        
        // Safety Fallback Check
        if (!env.YOCO_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "Missing YOCO_SECRET_KEY in Cloudflare Environment Settings Variables." }), { status: 500 });
        }

        let totalCents = 0;
        for (const item of cartItems) {
            totalCents += item.price * item.quantity;
        }

        const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;

        // Optional Database Save Try block so it won't crash checkout if database is unbound
        try {
            if (env.DB) {
                await env.DB.prepare(
                    "INSERT INTO orders (order_id, customer_name, customer_email, shipping_address, total_cents) VALUES (?, ?, ?, ?, ?)"
                ).bind(orderId, customerName, customerEmail, shippingAddress, totalCents).run();
            }
        } catch (dbError) {
            console.log("Database tracking skipped:", dbError.message);
        }

        // Clean up key format spacing string explicitly to prevent header structural rejections
        const cleanSecretKey = env.YOCO_SECRET_KEY.trim();

        // Fire transaction authorization request securely to Yoco Online Gateway Engine
        const yocoResponse = await fetch("https://yoco.com", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${cleanSecretKey}`,
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

        // Parse Yoco's server response text cleanly
        const responseText = await yocoResponse.text();
        
        let yocoData;
        try {
            yocoData = JSON.parse(responseText);
        } catch (parseError) {
            return new Response(JSON.stringify({ error: `Yoco rejected request format with HTML screen: ${responseText.substring(0, 150)}` }), { status: 500 });
        }
        
        if (yocoData && yocoData.redirectUrl) {
            return new Response(JSON.stringify({ redirectUrl: yocoData.redirectUrl }), {
                headers: { "Content-Type": "application/json" }
            });
        } else {
            return new Response(JSON.stringify({ error: `Yoco Gateway Refusal: ${yocoData.displayMessage || yocoData.message || JSON.stringify(yocoData)}` }), { status: 400 });
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: `System Processing Rejection: ${err.message}` }), { status: 500 });
    }
}
