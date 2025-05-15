
import { logError, logInfo } from "./logging.ts";
import { respondError } from "./response-utils.ts";

interface ParsedRequest {
  body: any;
  trackingId: string;
}

/**
 * Parse and validate request body
 * Handles various edge cases like bodyUsed, empty body, and invalid JSON
 */
export async function parseRequestBody(req: Request): Promise<Response | ParsedRequest> {
  try {
    // Check if request has a body
    if (req.bodyUsed) {
      logError("Request body already consumed", null);
      return respondError("Request body already consumed", 400);
    }

    const contentType = req.headers.get('content-type');
    logInfo(`Request content type: ${contentType}`);
    
    if (!contentType || !contentType.includes('application/json')) {
      logError(`Invalid content type: ${contentType}`, null);
      return respondError("Content-Type must be application/json", 400);
    }
    
    const text = await req.text();
    
    if (!text || text.trim() === '') {
      logError("Empty request body", null);
      return respondError("Request body cannot be empty", 400);
    }
    
    logInfo(`Raw request body length: ${text.length}`);
    if (text.length > 1000) {
      // Log a truncated version for very large bodies
      logInfo(`Request body preview: ${text.substring(0, 200)}...(truncated)`);
    } else {
      // Safe to log the full body for smaller payloads
      logInfo(`Raw request body: ${text}`);
    }
    
    let body;
    try {
      body = JSON.parse(text);
      logInfo(`Parsed body successfully with keys: ${Object.keys(body).join(', ')}`);
    } catch (parseError) {
      logError(`JSON parse error: ${parseError.message}`, parseError);
      return respondError(`Invalid JSON format: ${parseError.message}`, 400);
    }
    
    // Validate the body has required fields
    if (!body) {
      logError("Parsed body is null or undefined", null);
      return respondError("Invalid request body structure", 400);
    }

    // Validate required fields
    const { action, requestId, email } = body;
    
    if (!action) {
      logError("Missing 'action' field in request", null);
      return respondError("Missing required field: action", 400);
    }
    
    // Generate a request ID if none was provided
    const trackingId = requestId || crypto.randomUUID();
    logInfo(`Processing request ${trackingId} for action: ${action}, email: ${email ? email.substring(0, 2) + "..." : "none"}`);

    logInfo(`Parsed request body successfully: ${JSON.stringify(body, (key, value) => 
      key === 'password' ? '[REDACTED]' : value)}`);
    
    return { body, trackingId };
  } catch (e) {
    logError("Error processing request body", e);
    return respondError(`Error processing request body: ${e.message}`, 400);
  }
}
