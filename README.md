# Get Started with TideCloak

So, you want to build the most secure digital platforms on the planet, without the burden of worrying about security? Great!

This developer guide will take you through the minimal steps to build your own Single-Page React application, secured with TideCloak -  **all in under 10 minutes** .

TideCloak gives you a plug and play tool that incorporates all the concepts and technology discussed [in this series](https://tide.org/blog/rethinking-cybersecurity-for-developers). It allows you to manage your web users' roles and permissions - It's an adaptation of Redhat's open-source KeyCloak, one of the most robust, powerful and feature-rich Identity and Access Management system. But best of all it's secured by Tide's Cybersecurity Fabric so no-one holds the keys to the kingdom.

## Prerequisites

Before starting, make sure you have:

* Docker installed and running on your machine
* NPM installed
* Internet connectivity

For the purpose of this guide, we assume to run on a Debian linux host (either under Windows WSL or not).

## 1. Getting TideCloak up and running

Start a TideCloak-Dev docker container that already includes all the basic configuration and settings to get you going. To get it, open your Docker/WSL/Linux terminal and run the following command:

```
sudo docker run \
  -d \
  -v .:/opt/keycloak/data/h2 \
  -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:latest
```

This will take a minute or two, and when it's done, you'll be able to go to TideCloak's console at: [http://localhost:8080](http://localhost:8080/)

## 2. Activate your TideCloak license

To get your TideCloak host to tap into Tide's Cybersecurity Fabric, you'll need to activate your license. Tide offers free developer license for up to 100 users. To do that, you'll need to:

* Access your TideCloak administration console at [http://localhost:8080/admin/master/console/#/myrealm/identity-providers/tide/tide/settings](http://localhost:8080/admin/master/console/#/myrealm/identity-providers/tide/tide/settings)
* Log in using your admin credentials (Username: admin, Password: password, if you haven't changed it) (You should be automatically navigated to: myrealm realm --> Identity Providers --> tide IdP --> Settings screen)
* Click on the `Manage License` button next to `License`
* Click on the blue `Request License` button
* Go through the checkout process by providing a contact email

Within few seconds, you'll get your TideCloak host licenced and activated!

## 3. Create your React JS project

Let's create the following simple React project structure:

```
MyProject/
│
├── public/
│   ├── index.html
│   └── silent-check-sso.html
│
├── src/
│   ├── index.js
│   └── IAMService.js
│
└── package.json
```

Here's how:

### a. Create 3 folders:

```
mkdir -p MyProject/public
mkdir -p MyProject/src
cd MyProject
```

### b. Create index.html via `nano public/index.html`

```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>TideCloak Test React App</title>
  </head>

  <body>
    <noscript> You need to enable JavaScript to run this app. </noscript>
    <div id="root">Loading application...</div>
  </body>
</html>
```

### c. `nano public/silent-check-sso.html`

```
<html><body><script>parent.postMessage(location.href, location.origin)</script></body></html>
```

### d. `nano src/index.js`

```
import { createRoot } from "react-dom/client";
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

const renderApp = () => createRoot(document.getElementById("root")).render(<App />);

IAMService.initIAM(renderApp);
```

### e. `nano src/IAMService.js`

```
import TideCloak from "keycloak-js";

const _tc = new TideCloak({
  url: "http://localhost:8080",
  realm: "myrealm",
  clientId: "mytest",
});

const initIAM = (onAuthenticatedCallback) => {
  _tc.init({
      onLoad: "check-sso",
      silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
      pkceMethod: "S256",
    })
    .then((authenticated) => {
      if (!authenticated) {
        console.log("user is not authenticated..!");
      }
      onAuthenticatedCallback();
      console.log("AccessToken is " + _tc.token);
    })
    .catch(console.error);
};

const doLogin = _tc.login;

const doLogout = _tc.logout;

const isLoggedIn = () => !!_tc.token;

const updateToken = (successCallback) => _tc.updateToken(5).then(successCallback).catch(doLogin);

const getName = () => _tc.tokenParsed?.preferred_username;

const hasOneRole = (role) => _tc.hasRealmRole(role);

const IAMService = {
  initIAM,
  doLogin,
  doLogout,
  isLoggedIn,
  updateToken,
  getName,
  hasOneRole,
};

export default IAMService;
```

### f. `nano package.json`

```
{
  "name": "tidecloak-react",
  "version": "1.0.0",
  "private": false,
  "main": "src/index.js",
  "dependencies": {
    "keycloak-js": "26.0.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

## 4. Build your NPM environment

Download and install all the dependencies for this project:

```
npm install
```

## 5. Run your project

Build and run your project:

```
npm start
```

All done!

## 6. Play!

1. Go to [http://localhost:3000](http://localhost:3000/) You should see a "Hello!" message.
2. Click on the `Login` button
3. Click on `Create an account`
4. Provide a new username, password, recovery email

It will now show you that you're "Signed in" and it will show you your anonymous Tide username for this app.

## Project recap

Let's review what just happened and what you've just accomplished:

1. You have programmed, compiled, built and deployed, from the ground-up, a fully-functional ReactJS Single-Page-Application (SPA).
2. Web users can now sign up and sign in to your SPA, being served customized content to authenticated and unauthenticated users and based on their predefined roles.
3. Your web users' roles and permissions are managed locally on your very own self-hosted instance of TideCloak - one of the most robust, powerful and feature-rich Identity and Access Management system which you have downloaded, installed, configured and deployed locally.
4. Your web users enjoy fully-secured Tide accounts, with their identity and access-credentials sitting outside of anyone's reach.
5. Your TideCloak instance is secured by the global Tide Cybersecurity Fabric that you have activated and licensed.

## What next?

There's two additional layers of protection you can configure through TideCloak:

1. **Identity Governance:** Establish workflow processes ensuring that no compromised administrator can cause damage.
2. **User walletization:** Ability to lock user data with unique user keys secured by Tide's Cybersecurity Fabric - so ownership and privacy can be guaranteed.

### **For early access to these features [Sign up for our Beta Program](https://tide.org/beta)**
