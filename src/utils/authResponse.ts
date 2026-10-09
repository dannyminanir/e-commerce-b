import { signToken } from "./jwt";

// The same "token + user" response is used by register, login and admin login
export const buildAuthResponse = (user: { id: string; name: string; email: string; role: string }) => ({
  token: signToken({ id: user.id }),
  user: { id: user.id, name: user.name, email: user.email, role: user.role },
});
