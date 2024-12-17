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
