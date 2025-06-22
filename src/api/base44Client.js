import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6857187479e5ec2c9f3be64a", 
  requiresAuth: true // Ensure authentication is required for all operations
});
