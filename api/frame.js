// Frame API endpoint - updated with auth support
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check for authentication header
  const authHeader = req.headers['authorization'] || req.headers['x-farcaster-auth'];
  const isAuthenticated = !!authHeader;
  
  const frameResponse = {
    type: 'frame',
    frame: {
      version: "vNext",
      image: "https://ola-azure.vercel.app/hero.png",
      buttons: [
        {
          label: isAuthenticated ? "🎮 Continue Playing" : "🎮 Play Four in a Row",
          action: "post_redirect"
        }
      ],
      postUrl: "https://ola-azure.vercel.app/api/frame",
    },
    auth: {
      required: true,
      status: isAuthenticated ? 'authenticated' : 'unauthenticated'
    }
  };

  return res.status(200).json(frameResponse);
};
