export async function onRequestPost(context) {
    const { env, request } = context;
    
    // Set up standard CORS headers to prevent browser rejection blocks
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    try {
        const body = await request.json();
        const { customerName, customerEmail, shippingAddress, cartItems } = body;
        
        // Safety Fallback Check for Credentials
        if (!env.YOCO_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "Missing YOCO_SECRET_KEY variable inside your Cloudflare Dashboard panel configurations." }), { status: 500, headers: corsHeaders });
        }

        // Calculate total price server-side strictly in cents
        let totalCents = 0;
        for (const item of cartItems) {
            totalCents += item.price * item.quantity;
        }

        const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;

        // Optional Cloudflare D1 SQL Database Tracking entry block
        try {
            if (env.DB) {
                await env.DB.prepare(
                    "INSERT INTO orders (order_id, customer_name, customer_email, shipping_address, total_cents) VALUES (?, ?, ?, ?, ?)"
                ).bind(orderId, customerName, customerEmail, shippingAddress, totalCents).run();
            }
        } catch (dbError) {
            console.log("Database entry logged and skipped safely:", dbError.message);
        }

        // Sanitize token characters and remove any stray clipboard whitespaces
        const cleanSecretKey = env.YOCO_SECRET_KEY.trim();

        // 🚀 OFFICIAL COMPATIBLE YOCO CHARGE INITIATION ENGINE
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

        // Capture raw response buffer string cleanly
        const responseText = await yocoResponse.text();
        
        let yocoData;
        try {
            yocoData = JSON.parse(responseText);
        } catch (parseError) {
            return new Response(JSON.stringify({ error: `Yoco credentials blocked request layout with an HTML gate screen. Verify your sk_test_ key value on Cloudflare.` }), { status: 500, headers: corsHeaders });
        }
        
        // Handle redirect extraction logic variations natively
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

// Handle browser pre-flight checks natively
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
