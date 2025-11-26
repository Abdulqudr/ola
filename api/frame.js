// frame.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Handle authentication callback
  if (req.method === 'POST' && req.body && req.body.trustedData) {
    try {
      // Verify the authentication
      const { verifySignIn } = require('@farcaster/quick-auth');
      const { fid, username } = await verifySignIn({
        messageBytes: req.body.trustedData.messageBytes,
        domain: 'ola-azure.vercel.app'
      });
      
      // Successful authentication
      const frameResponse = {
        type: 'frame',
        frame: {
          version: "vNext",
          image: `https://ola-azure.vercel.app/api/welcome-image?fid=${fid}&username=${username}`,
          buttons: [
            {
              label: "🎮 Play Game",
              action: "launch_miniapp",
              target: "https://ola-azure.vercel.app"
            }
          ]
        }
      };
      
      return res.status(200).json(frameResponse);
    } catch (error) {
      console.error('Auth error:', error);
    }
  }
  
  // Default frame with sign-in button
  const frameResponse = {
    type: 'frame',
    frame: {
      version: "vNext",
      image: "https://ola-azure.vercel.app/hero.png",
      buttons: [
        {
          label: "🔐 Sign In & Play",
          action: "sign_in"
        }
      ],
      postUrl: "https://ola-azure.vercel.app/api/frame",
    }
  };

  return res.status(200).json(frameResponse);
};
