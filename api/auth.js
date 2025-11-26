// api/auth.js
const { createClient, Errors } = require('@farcaster/quick-auth');

const domain = 'ola-azure.vercel.app';
const client = createClient();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = await client.verifyJwt({ token, domain });
    
    return res.json({
      fid: payload.sub,
      success: true
    });
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    throw e;
  }
};
