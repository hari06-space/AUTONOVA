const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
const { TokenCredentialAuthenticationProvider } = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
require('isomorphic-fetch');

async function test() {
  const credential = new ClientSecretCredential(
    "84ca9efe-e19a-456a-ad9a-16220d0399bf",
    "c7661b1e-9bf7-44b3-b3e2-d462c240dc90",
    process.env.MSGRAPH_CLIENT_SECRET || "placeholder_client_secret"
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"]
  });

  const client = Client.initWithMiddleware({
    debugLogging: true,
    authProvider
  });

  try {
    const res = await client.api("/users").select("displayName,userPrincipalName").top(10).get();
    console.log("USERS IN YOUR TENANT:");
    res.value.forEach(u => console.log(`- ${u.displayName} (${u.userPrincipalName})`));
  } catch (err) {
    console.error("ERROR LISTING USERS:");
    console.error(err.message);
  }
}

test();
