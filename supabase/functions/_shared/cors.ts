
// CORS headers for edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control', // Added cache-control
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
