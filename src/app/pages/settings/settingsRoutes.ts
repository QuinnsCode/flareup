import { route } from "rwsdk/router";
import SettingsPage from "./SettingsPage";

export const settingsRoutes = [
  route("/", SettingsPage),
];