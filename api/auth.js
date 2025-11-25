// Farcaster Authentication API Endpoint
// Save this as api/auth.js

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests for authentication
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }
  
  try {
    const { message, signature } = req.body;
    
    // Validate required fields
    if (!message || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message and signature'
      });
    }
    
    // Parse the message if it's a string
    const authMessage = typeof message === 'string' ? JSON.parse(message) : message;
    
    // Basic validation of Farcaster auth message structure
    if (!authMessage.domain || !authMessage.uri || !authMessage.version || !authMessage.nonce) {
      return res.status(400).json({
        success: false,
        error: 'Invalid auth message structure'
      });
    }
    
    // In a production environment, you would:
    // 1. Verify the signature cryptographically
    // 2. Validate the domain matches your app
    // 3. Check the nonce for replay attacks
    // 4. Verify the expiration time
    
    // For demo purposes, we'll accept the authentication
    // and return a mock user profile
    
    const userProfile = {
      success: true,
      user: {
        fid: authMessage.fid || 1059398,
        username: authMessage.username || `user${authMessage.fid || '1059398'}`,
        displayName: authMessage.displayName || 'Farcaster User',
        pfpUrl: authMessage.pfpUrl || 'https://ola-azure.vercel.app/icon.png',
        bio: authMessage.bio || 'Connect Four player',
        custody: authMessage.custody || '0xe1Bd3D122995a3d3A253F564c1fD54d18407A657'
      },
      auth: {
        token: generateAuthToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        scope: ['read', 'write']
      }
    };
    
    console.log('Farcaster auth successful for FID:', userProfile.user.fid);
    
    return res.status(200).json(userProfile);
    
  } catch (error) {
    console.error('Auth API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to generate a simple auth token
function generateAuthToken() {
  return 'fc_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// If you want to add proper signature verification later, use this structure:
/*
async function verifySignature(message, signature, publicKey) {
  // This would use proper cryptographic verification
  // You'd need to implement this based on Farcaster's crypto requirements
  return true; // placeholder
}
*/
