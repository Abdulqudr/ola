// api/frame.js
module.exports = async (req, res) => {
  // Set CORS headers - important for Farcaster Frames
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Your Frame response
  const frameResponse = {
    type: 'frame',
    frame: {
      version: "vNext",
      image: "https://ola-azure.vercel.app/hero.png",
      buttons: [
        {
          label: "🎮 Play Four in a Row",
          action: "post_redirect"
        }
      ],
      postUrl: "https://ola-azure.vercel.app/api/frame",
    }
  };

  if (req.method === 'POST') {
    try {
      console.log('Received POST request for frame');
      // You can process the POST data here if needed
      // const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      // console.log('Request body:', body);
      
      return res.status(200).json(frameResponse);
    } catch (error) {
      console.error('Frame API error:', error);
      return res.status(200).json(frameResponse);
    }
  } else {
    // Handle GET requests
    console.log('Received GET request for frame');
    return res.status(200).json(frameResponse);
  }
};
