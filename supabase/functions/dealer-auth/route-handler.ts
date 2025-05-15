
import { handleDealerRegister, handleDealerLogin } from "./handlers.ts";
import { respondSuccess } from "./response-utils.ts";
import { logError } from "./logging.ts";
import { processWithRetry } from "./retry-handler.ts";
import { parseRequestBody } from "./request-parser.ts";

/**
 * Handles the main routing of dealer auth requests
 */
export async function handleDealerAuthRequest(req: Request, startTime: number): Promise<Response> {
  try {
    // Parse request body
    const parseResult = await parseRequestBody(req);
    
    // If parseResult is a Response, return it (error occurred)
    if (parseResult instanceof Response) {
      return parseResult;
    }

    const { body, trackingId } = parseResult;

    // Handle the different actions
    switch (body.action) {
      case "register":
        return await processWithRetry(
          () => handleDealerRegister(body, trackingId),
          trackingId,
          startTime
        );
      case "login":
        return await processWithRetry(
          () => handleDealerLogin(body, trackingId),
          trackingId,
          startTime
        );
      case "debug":
        // Add a debug endpoint to help troubleshoot request issues
        return respondSuccess({
          success: true,
          debug: {
            method: req.method,
            headers: Object.fromEntries(req.headers.entries()),
            body: { ...body, password: body.password ? "[REDACTED]" : undefined },
            url: req.url,
            timestamp: new Date().toISOString(),
            trackingId
          }
        });
      default:
        logError(`Unknown action: ${body.action}`, null);
        return respondSuccess({
          success: false,
          error: `Unknown action: ${body.action}`
        }, 400);
    }
  } catch (error) {
    // Handle unexpected errors
    logError("Unhandled exception in route handler", error);
    return respondSuccess({
      success: false,
      error: `Internal server error: ${error.message}`
    }, 500);
  }
}
