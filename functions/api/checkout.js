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
            return new Response(JSON.stringify({ error: "Missing YOCO_SECRET_KEY inside Cloudflare panel settings." }), { status: 500, headers: corsHeaders });
        }

        let totalCents = 0;
        for (const item of cartItems) {
            totalCents += item.price * item.quantity;
        }

        const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;

        // Sanitize token characters string to explicitly remove hidden whitespaces or carriage returns
        const cleanSecretKey = env.YOCO_SECRET_KEY.replace(/[\n\r\t\s]/g, "").trim();

        // 🚀 OFFICIAL YOCO DIRECT HOSTED CHECKOUT LINK DISPATCH ENGINE
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
                cancelUrl: `https://${request.headers.get("host")}/`
            })
        });

        const responseText = await yocoResponse.text();
        
        // If Yoco returns an error web view page, intercept and output it explicitly
        if (responseText.includes("<!DOCTYPE") || responseText.includes("<html")) {
            return new Response(JSON.stringify({ 
                error: `Yoco Firewall Rejection. This means your sk_test_ value saved in Cloudflare is failing authentication. Ensure you did not copy the Public key (pk_test_).` 
            }), { status: 401, headers: corsHeaders });
        }

        let yocoData;
        try {
            yocoData = JSON.parse(responseText);
        } catch (parseError) {
            return new Response(JSON.stringify({ error: `Failed parsing reply. Raw details: ${responseText.substring(0, 100)}` }), { status: 500, headers: corsHeaders });
        }
        
        if (yocoData && yocoData.redirectUrl) {
            return new Response(JSON.stringify({ redirectUrl: yocoData.redirectUrl }), {
                status: 200,
                headers: corsHeaders
            });
        } else {
            return new Response(JSON.stringify({ error: `Yoco Gateway Decline: ${yocoData.displayMessage || yocoData.message || responseText.substring(0, 120)}` }), { status: 400, headers: corsHeaders });
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
