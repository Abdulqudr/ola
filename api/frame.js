module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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

  return res.status(200).json(frameResponse);
};
