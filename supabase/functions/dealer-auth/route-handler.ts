
import { handleDealerRegister, handleDealerLogin, handleCheckDealerEmail } from "./handlers.ts";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logInfo, logError, logWarning } from "./logging.ts";
import { processWithRetry } from "./retry-handler.ts";
import { parseRequestBody } from "./request-parser.ts";

/**
 * Handles the main routing of dealer auth requests
 */
export async function handleDealerAuthRequest(req: Request, startTime: number): Promise<Response> {
  try {
    // Log request headers for debugging
    logInfo(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers.entries()))}`);
    
    // Parse request body
    const parseResult = await parseRequestBody(req);
    
    // If parseResult is a Response, return it (error occurred)
    if (parseResult instanceof Response) {
      return parseResult;
    }

    const { body, trackingId } = parseResult;

    // Log the successfully parsed body
    logInfo(`Successfully parsed request body for action: ${body.action}`, { 
      action: body.action,
      trackingId,
      requestId: body.requestId,
      email: body.email ? `${body.email.substring(0, 3)}...` : undefined
    });

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
      case "check_dealer_email":
        return await processWithRetry(
          () => handleCheckDealerEmail(body, trackingId),
          trackingId,
          startTime
        );
      case "debug":
        // Add a debug endpoint to help troubleshoot request issues
        logInfo(`Debug request received, trackingId: ${trackingId}`);
        return respondSuccess({
          success: true,
          debug: {
            method: req.method,
            headers: Object.fromEntries(req.headers.entries()),
            body: { ...body, password: body.password ? "[REDACTED]" : undefined },
            url: req.url,
            timestamp: new Date().toISOString(),
            trackingId,
            parseResult: "successful"
          }
        });
      default:
        logError(`Unknown action: ${body.action}`, null);
        return respondError(`Unknown action: ${body.action}`, 400);
    }
  } catch (error) {
    // Handle unexpected errors
    logError("Unhandled exception in route handler", error);
    return respondError(
      `Internal server error: ${error.message}`,
      500
    );
  }
}
