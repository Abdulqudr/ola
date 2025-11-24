// This endpoint responds to Farcaster Frame POST events

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const buttonIndex = body?.untrustedData?.buttonIndex || 0;

    // FIRST LOAD: Show main preview
    if (buttonIndex === 0) {
      return Response.json({
        type: "frame",
        version: "vNext",
        image: "https://ola-azure.vercel.app/hero.png",
        buttons: [
          { label: "Start Game" }
        ]
      });
    }

    // BUTTON 1 PRESSED → Open your game
    return Response.json({
      type: "frame",
      version: "vNext",
      image: "https://ola-azure.vercel.app/hero.png",
      buttons: [
        {
          label: "Play Now",
          action: "launch"
        }
      ],
      launch_url: "https://ola-azure.vercel.app/"
    });

  } catch (err) {
    console.error("Frame error:", err);
    return new Response("Error generating frame", { status: 500 });
  }
}
