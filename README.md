# Get Started with TideCloak

So, you want to build the most secure digital platforms on the planet, without the burden of worrying about security, and simultaneously grant your users sovereignty over their identities? Great!

This developer guide will take you through the minimal steps to build your own Single-Page React application, secured with TideCloak -  **all in under 10 minutes** .

TideCloak gives you a plug and play tool that incorporates all the concepts and technology discussed [in this series](https://tide.org/blog/rethinking-cybersecurity-for-developers). It allows you to manage your web users' roles and permissions - It's an adaptation of Redhat's open-source [Keycloak](https://keycloak.org), one of the most robust, powerful and feature-rich Identity and Access Management system. But best of all it's secured by Tide's Cybersecurity Fabric so no-one holds the keys to the kingdom.

## Prerequisites

Before starting, make sure you have:

* Docker installed and running on your machine
* NPM installed
* Internet connectivity

For the purpose of this guide, we assume to run on a Debian linux host (either under Windows WSL or not).

## 1. Getting TideCloak up and running

Start a TideCloak-Dev docker container that already includes all the basic configuration and settings to get you going. To get it, open your Docker/WSL/Linux terminal and run the following command:

```bash
sudo docker run \
  -d \
  -v .:/opt/keycloak/data/h2 \
  -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:latest
```

This will take a **minute or two**, and when it's done, you'll be able to go to TideCloak's console at: [http://localhost:8080](http://localhost:8080/)

## 2. Activate your TideCloak license

To get your TideCloak host to tap into Tide's Cybersecurity Fabric, you'll need to activate your license. Tide offers free developer license for up to 100 users. To do that, you'll need to:

* Access your TideCloak administration console at [http://localhost:8080/admin/master/console/#/myrealm/identity-providers/tide/tide/settings](http://localhost:8080/admin/master/console/#/myrealm/identity-providers/tide/tide/settings)
* Log in using your admin credentials (Username: `admin`, Password: `password`, if you haven't changed it) (You should be automatically navigated to: myrealm realm --> Identity Providers --> tide IdP --> Settings screen)
* Click on the `Manage License` button next to `License`
* Click on the blue `Request License` button
* Go through the checkout process by providing a contact email

Within few seconds, you'll get your TideCloak host licenced and activated!

## 3. Create your React JS project

### a. Create a React app using Vite

Run the following commands to create a new React app using [Vite](https://vitejs.dev/guide/#scaffolding-your-first-vite-project):

```bash
npm create vite@latest tidecloak-react -- --template react-ts
cd tidecloak-react
npm install tidecloak-js
```

### b. `nano public/silent-check-sso.html`

```html
<html><body><script>parent.postMessage(location.href, location.origin)</script></body></html>
```

### c. `nano src/main.tsx`

Make the following changes:
```diff
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
+ import IAMService from "./IAMService";
- import App from './App.tsx'

+ const RenderOnAnonymous = ({ children }) => (!IAMService.isLoggedIn() ? children : null);
+
+ const RenderOnAuthenticated = ({ children }) => (IAMService.isLoggedIn() ? children : null);
+
+ const IsAllowedToViewProfile = () => (IAMService.hasOneRole("default-roles-myrealm") ? "Yes" : "No");
+
+ const App = () => (
+   <div>
+     <RenderOnAnonymous>
+       <div>
+         <h1>Hello!</h1>
+         <p>Please authenticate yourself!</p>
+         <p><button onClick={() => IAMService.doLogin()}>Login</button></p>
+       </div>
+     </RenderOnAnonymous>
+     <RenderOnAuthenticated>
+       <div>
+         <p>Signed in as <b>{IAMService.getName()}</b></p>
+         <p>Has Default Roles? <b>{IsAllowedToViewProfile()}</b></p>
+         <p><button onClick={() => IAMService.doLogout()}>Logout</button></p>
+       </div>
+     </RenderOnAuthenticated>
+   </div>
+ );
+ 
+ const renderApp = () => 
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
+ ;
+
+ IAMService.initIAM(renderApp);
```

So it looks like this:
```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import IAMService from "./IAMService";

const RenderOnAnonymous = ({ children }) => (!IAMService.isLoggedIn() ? children : null);

const RenderOnAuthenticated = ({ children }) => (IAMService.isLoggedIn() ? children : null);

const IsAllowedToViewProfile = () => (IAMService.hasOneRole("default-roles-myrealm") ? "Yes" : "No");

const App = () => (
  <div>
    <RenderOnAnonymous>
      <div>
        <h1>Hello!</h1>
        <p>Please authenticate yourself!</p>
        <p><button onClick={() => IAMService.doLogin()}>Login</button></p>
      </div>
    </RenderOnAnonymous>
    <RenderOnAuthenticated>
      <div>
        <p>Signed in as <b>{IAMService.getName()}</b></p>
        <p>Has Default Roles? <b>{IsAllowedToViewProfile()}</b></p>
        <p><button onClick={() => IAMService.doLogout()}>Logout</button></p>
      </div>
    </RenderOnAuthenticated>
  </div>
);

const renderApp = () => createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

IAMService.initIAM(renderApp);
```

### d. `nano src/IAMService.js`

```javascript
import TideCloak from "tidecloak-js"
import kcData from "/tidecloak.json";

let _tc = null;
 
function getTideCloakClient() {
  if (!_tc) {
    if ( Object.keys(kcData).length == 0 ) {
	  console.error('[getTideCloakClient] tidecloak.json is empty. Web admin must download client adaptor from TideCloak.');
    } else {
      _tc = new TideCloak({
        url: kcData['auth-server-url'],
        realm: kcData['realm'],
        clientId: kcData['resource'],
        vendorId: kcData['vendorId'],
        homeOrkUrl: kcData['homeOrkUrl']
      });
    }
  }
  return _tc;
}

const updateIAMToken = async () => {
  const tidecloak = getTideCloakClient();
  if (tidecloak) { await tidecloak.updateToken(300).then((refreshed) => {
    if (refreshed) {
      console.debug('[updateIAMToken] Token refreshed: '+ Math.round(tidecloak.tokenParsed.exp + tidecloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
      if (! typeof window === "undefined" ) { 
        document.cookie = `kcToken=${tidecloak.token}; path=/;`; 
      };
    } else {
      console.debug('[updateIAMToken] Token not refreshed, valid for '
        + Math.round(tidecloak.tokenParsed.exp + tidecloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
    }
  }).catch((err) => {
    console.error('[updateIAMToken] Failed to refresh token', err);
    throw err;
  });}
}

const initIAM = (onReadyCallback) => {
  const tidecloak = getTideCloakClient();
  if (typeof window === "undefined") {
    // We are on the server, do nothing
    return;
  }

  if (!tidecloak) {  return; }
  tidecloak.onTokenExpired = async () => { await updateIAMToken() };
  if (!tidecloak.didInitialize) {
    tidecloak.init({
      onLoad: "check-sso",
      silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
      pkceMethod: "S256",
    })
    .then((authenticated) => {
      // If authenticated, store the token in a cookie so the middleware can read it.
      if (authenticated && tidecloak.token) {
        document.cookie = `kcToken=${tidecloak.token}; path=/;`;
      }

      if (onReadyCallback) {
        onReadyCallback(authenticated);
      }
    })
    .catch((err) => console.error("TideCloak init err:", err));
  }else{
    if (onReadyCallback) {
      onReadyCallback(true);
    }
  }

};

const doLogin = () => {
  const tidecloak = getTideCloakClient();
  if (tidecloak) { tidecloak.login({redirectUri: window.location.origin + "/auth/redirect"}); }
};

const doLogout = () => {
  const tidecloak = getTideCloakClient();
  // Clear the cookie so the server no longer sees the old token
  document.cookie = "kcToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  if (tidecloak) { tidecloak.logout({redirectUri: window.location.origin +"/auth/redirect" }); }
};

const isLoggedIn = () => {
  const tidecloak = getTideCloakClient();
  if (!tidecloak) {  return null; }
  return !!tidecloak.token;
};

const getToken = async () => {
  const tidecloak = getTideCloakClient();
  if (tidecloak) {
    const tokenExp = getTokenExp();
    if ( tokenExp < 3 ) {
      try {
        await updateIAMToken();
        console.debug('Refreshed the token');
      } catch (error) {
        console.error('Failed to refresh the token', error);
        tidecloak.logout();
        return null;
      }
    }
    return tidecloak.token ?? null;
  }
  return null;
};

const getName = () => {
  const tidecloak = getTideCloakClient();
  if (!tidecloak) {  return null; }
  return tidecloak.tokenParsed?.preferred_username;
};

const getTokenExp = () => {
  const tidecloak = getTideCloakClient();
  if (!tidecloak) {  return null; }
  return Math.round(tidecloak.tokenParsed?.exp + tidecloak.timeSkew - new Date().getTime() / 1000);
};

const hasOneRole = (role) => {
  const tidecloak = getTideCloakClient();
  if (!tidecloak) {  return null; }
  return tidecloak.hasRealmRole(role);
};

const IAMService = {
  initIAM,
  doLogin,
  doLogout,
  isLoggedIn,
  getToken,
  getName,
  hasOneRole,
  getTokenExp,
};

export default IAMService;
```

## 4. Export your TideCloak adapter

Export your specific TideCloak settings and hardcode it in your project:

1. Go to your [Clients](http://localhost:8080/admin/nextjs-test/console/#/myrealm/clients) menu → `mytest` client ID
2. Update `Valid redirect URIs` to `http://localhost:5173/*`
3. Update `Web origins` to `http://localhost:5173`
4. In your [Clients](http://localhost:8080/admin/nextjs-test/console/#/myrealm/clients) menu → `mytest` client ID → `Action` dropdown → `Download adaptor configs` option (keep it as `keycloak-oidc-keycloak-json` format)
5. `Download` or copy the details of that config and paste it in your project's root folder under `tidecloak.json`.

## 5. Build your NPM environment

Download and install all the dependencies for this project:

```bash
npm install
```

## 5. Run your project

Build and run your project:

```bash
npm run dev
```

All done!

## 6. Play!

1. Go to [http://localhost:5173](http://localhost:5173/) You should see a "Hello!" message.
2. Click on the `Login` button
3. Click on `Create an account`
4. Provide a new username, password, recovery email(s)

It will now show you that you're "Signed in" and it will show you your anonymous Tide username for this app.

## Project recap

Let's review what just happened and what you've just accomplished:

1. You have programmed, compiled, built and deployed, from the ground-up, a fully-functional ReactJS Single-Page-Application (SPA).
2. Web users can now sign up and sign in to your SPA, being served customized content to authenticated and unauthenticated users and based on their predefined roles.
3. Your web users' roles and permissions are managed locally on your very own self-hosted instance of TideCloak - one of the most robust, powerful and feature-rich Identity and Access Management system which you have downloaded, installed, configured and deployed locally.
4. Your web users enjoy fully-secured Tide accounts, with their identity and access-credentials sitting outside of anyone's reach.
5. Your TideCloak instance is secured by the global Tide Cybersecurity Fabric that you have activated and licensed.

## What next?

There are two additional layers of protection you can configure through TideCloak:

1. **Identity Governance:** Establish workflow processes ensuring that no compromised administrator can cause damage.
2. **User walletization:** Ability to lock user data with unique user keys secured by Tide's Cybersecurity Fabric - so ownership and privacy can be guaranteed.

### **For early access to these features [Sign up for our Alpha Program](https://tide.org/alpha)**
