import { renderNativeAccessPoint } from './_native-access-session.js';

export async function onRequest(context) {
  return renderNativeAccessPoint(context);
}
