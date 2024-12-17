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
