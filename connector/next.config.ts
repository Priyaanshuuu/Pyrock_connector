import type { NextConfig } from "next";
import { randomBytes } from "node:crypto";

// Local prototype sessions need one signing key shared by every route bundle.
// Set a stable secret explicitly when running more than one server instance.
process.env.PYROCK_DEMO_SESSION_SECRET ??= randomBytes(32).toString("hex");

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
