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

        const {
            customerName,
            customerEmail,
            shippingAddress,
            cartItems
        } = body;

        if (!env.YOCO_SECRET_KEY) {
            return new Response(
                JSON.stringify({
                    error: "YOCO_SECRET_KEY is missing from Cloudflare Environment Variables"
                }),
                {
                    status: 500,
                    headers: corsHeaders
                }
            );
        }

        let totalCents = 0;

        for (const item of cartItems || []) {
            totalCents += Number(item.price) * Number(item.quantity);
        }

        const orderId =
            "TL-" + Math.floor(100000 + Math.random() * 900000);

        const secretKey = env.YOCO_SECRET_KEY.trim();

        const successUrl =
            `https://${request.headers.get("host")}/thank-you.html?orderId=${orderId}`;

        const cancelUrl =
            `https://${request.headers.get("host")}/`;

        const payload = {
            amount: totalCents,
            currency: "ZAR",
            successUrl,
            cancelUrl
        };

        // IMPORTANT:
        // Replace endpoint below with the Yoco Checkout API endpoint
        const yocoResponse = await fetch(
            "https://payments.yoco.com/api/checkouts",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${secretKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const responseText = await yocoResponse.text();

        let yocoData;

        try {
            yocoData = JSON.parse(responseText);
        } catch (error) {
            return new Response(
                JSON.stringify({
                    error: "Yoco returned non-JSON response",
                    raw: responseText.substring(0, 500)
                }),
                {
                    status: 500,
                    headers: corsHeaders
                }
            );
        }

        if (!yocoResponse.ok) {
            return new Response(
                JSON.stringify({
                    error: yocoData.message || "Yoco API error",
                    yoco: yocoData
                }),
                {
                    status: yocoResponse.status,
                    headers: corsHeaders
                }
            );
        }

        return new Response(
            JSON.stringify(yocoData),
            {
                status: 200,
                headers: corsHeaders
            }
        );

    } catch (error) {

        console.error(error);

        return new Response(
            JSON.stringify({
                error: error.message
            }),
            {
                status: 500,
                headers: corsHeaders
            }
        );
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
