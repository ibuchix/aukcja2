
// Helper to build a standardized success response
export function buildSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// Helper to build a standardized error response
export function buildErrorResponse(status: number, message: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}
