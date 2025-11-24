export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  return new Response(
    JSON.stringify({
      version: "vNext",
      image: "https://ola-azure.vercel.app/hero.png",
      buttons: [
        {
          label: "Play",
          action: "launch_mini_app",
          target: "https://ola-azure.vercel.app/"
        }
      ]
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    }
  );
}
