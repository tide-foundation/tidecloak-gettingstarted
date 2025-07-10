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
  getTokenExp
};

export default IAMService;
