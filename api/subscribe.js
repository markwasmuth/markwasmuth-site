export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, source } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    try {
        const response = await fetch(
            'https://api.beehiiv.com/v2/publications/pub_a36882ed-0cb5-46bb-ac00-63adc1d7dc15/subscriptions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.BEEHIIV_API_KEY}`
                },
                body: JSON.stringify({
                    email: email,
                    reactivate_existing: true,
                    send_welcome_email: true,
                    utm_source: 'website',
                    utm_medium: source || 'book-chapter15'
                })
            }
        );

        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            const error = await response.text();
            console.error('Beehiiv error:', error);
            return res.status(500).json({ error: 'Subscription failed' });
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
