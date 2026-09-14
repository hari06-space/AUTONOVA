const { ClientSecretCredential } = require("@azure/identity");

async function test() {
  const credential = new ClientSecretCredential(
    "84ca9efe-e19a-456a-ad9a-16220d0399bf",
    "c7661b1e-9bf7-44b3-b3e2-d462c240dc90",
    process.env.MSGRAPH_CLIENT_SECRET || "placeholder_client_secret"
  );

  try {
    const token = await credential.getToken("https://graph.microsoft.com/.default");
    console.log("TOKEN SUCCESS!");
    console.log("Token starts with:", token.token.substring(0, 50));
    console.log("Expires at:", token.expiresOnTimestamp);
  } catch (err) {
    console.error("TOKEN ERROR:");
    console.error(err.message);
  }
}

test();
