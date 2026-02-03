const https = require('https');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, source } = req.body || {};

    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    const apiKey = process.env.BEEHIIV_API_KEY;
    if (!apiKey) {
        console.error('BEEHIIV_API_KEY not set');
        return res.status(500).json({ error: 'API key not configured' });
    }

    // Debug: log that we have the key (not the key itself)
    console.log('API key exists, length:', apiKey.length);

    const data = JSON.stringify({
        email: email,
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: 'website',
        utm_medium: source || 'book-chapter15'
    });

    const options = {
        hostname: 'api.beehiiv.com',
        port: 443,
        path: '/v2/publications/pub_a36882ed-0cb5-46bb-ac00-63adc1d7dc15/subscriptions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': data.length
        }
    };

    return new Promise((resolve) => {
        const request = https.request(options, (response) => {
            let body = '';
            response.on('data', (chunk) => { body += chunk; });
            response.on('end', () => {
                console.log('Beehiiv response:', response.statusCode, body);
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    res.status(200).json({ success: true, beehiivStatus: response.statusCode });
                } else {
                    res.status(response.statusCode).json({
                        error: 'Subscription failed',
                        beehiivStatus: response.statusCode,
                        details: body
                    });
                }
                resolve();
            });
        });

        request.on('error', (error) => {
            console.error('Request error:', error);
            res.status(500).json({ error: 'Server error' });
            resolve();
        });

        request.write(data);
        request.end();
    });
};
