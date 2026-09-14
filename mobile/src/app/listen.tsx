import { Redirect } from "expo-router";

/**
 * scriptune://listen, used by the home-screen widgets and app shortcuts:
 * lands on the Identify tab and starts listening at once.
 */
export default function ListenRedirect() {
  return <Redirect href={{ pathname: "/(tabs)", params: { listen: "1" } }} />;
}
