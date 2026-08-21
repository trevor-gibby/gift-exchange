/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the project-maintained agents.md as the only agent source of truth.
  agentRules: false,
};

export default nextConfig;
