export async function onRequestPost(context) {
    const { env, request } = context;
    
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    try {
        const body = await request.json();
        const { customerName, customerEmail, shippingAddress, cartItems } = body;
        
        if (!env.YOCO_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "Missing YOCO_SECRET_KEY inside Cloudflare variables." }), { status: 500, headers: corsHeaders });
        }

        let totalCents = 0;
        for (const item of cartItems) {
            totalCents += item.price * item.quantity;
        }

        const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;

        try {
            if (env.DB) {
                await env.DB.prepare(
                    "INSERT INTO orders (order_id, customer_name, customer_email, shipping_address, total_cents) VALUES (?, ?, ?, ?, ?)"
                ).bind(orderId, customerName, customerEmail, shippingAddress, totalCents).run();
            }
        } catch (dbError) {
            console.log("Database entry skipped:", dbError.message);
        }

        const cleanSecretKey = env.YOCO_SECRET_KEY.trim();

        // 🚀 COMBINED SECURITY MATRIX FOR YOCO'S AUTHORIZATION ENGINE
        const yocoResponse = await fetch("https://yoco.com", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${cleanSecretKey}`,
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
            return new Response(JSON.stringify({ error: `Yoco configuration mismatch. Please delete and re-paste your sk_test_ value into your Cloudflare variables panel settings.` }), { status: 500, headers: corsHeaders });
        }
        
        if (yocoData && yocoData.redirectUrl) {
            return new Response(JSON.stringify({ redirectUrl: yocoData.redirectUrl }), {
                status: 200,
                headers: corsHeaders
            });
        } else {
            return new Response(JSON.stringify({ error: `Yoco Core Refusal: ${yocoData.displayMessage || yocoData.message || JSON.stringify(yocoData)}` }), { status: 400, headers: corsHeaders });
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: `System Processing Rejection: ${err.message}` }), { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
