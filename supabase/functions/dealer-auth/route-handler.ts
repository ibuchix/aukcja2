
import { handleDealerRegister, handleDealerLogin, handleCheckDealerEmail, handlePasswordResetRequest, handlePasswordResetConfirm } from "./handlers.ts";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logInfo, logError, logWarning } from "./logging.ts";
import { processWithRetry } from "./retry-handler.ts";
import { parseRequestBody } from "./request-parser.ts";

/**
 * Verify Cloudflare Turnstile token server-side
 */
async function verifyTurnstileToken(token: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
  
  if (!secretKey) {
    logWarning("TURNSTILE_SECRET_KEY not configured - skipping Turnstile verification");
    return { success: true };
  }

  // Allow fallback tokens from frontend load failures
  if (token === "TURNSTILE_LOAD_FAILED" || token === "TURNSTILE_TIMEOUT") {
    logWarning(`Turnstile fallback token received: ${token} - allowing request`);
    return { success: true };
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const result = await response.json();
    logInfo(`Turnstile verification result: success=${result.success}`);

    if (!result.success) {
      logWarning(`Turnstile verification failed: ${JSON.stringify(result["error-codes"] || [])}`);
      return { success: false, error: "Weryfikacja Turnstile nie powiodła się. Spróbuj ponownie." };
    }

    return { success: true };
  } catch (error) {
    logError("Turnstile verification request failed", error);
    // On network errors, allow the request through (graceful degradation)
    return { success: true };
  }
}

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

    // Verify Turnstile token for all actions except debug and check_dealer_email
    const actionsRequiringTurnstile = ["login", "register", "password_reset_request", "password_reset_confirm"];
    if (actionsRequiringTurnstile.includes(body.action)) {
      const turnstileToken = body.turnstileToken;
      
      if (!turnstileToken) {
        // Only enforce if TURNSTILE_SECRET_KEY is configured
        const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
        if (secretKey) {
          logWarning(`Missing Turnstile token for action: ${body.action}`);
          return respondError("Brak tokenu weryfikacji Turnstile. Odśwież stronę i spróbuj ponownie.", 400);
        }
      } else {
        const turnstileResult = await verifyTurnstileToken(turnstileToken);
        if (!turnstileResult.success) {
          return respondError(turnstileResult.error || "Weryfikacja nie powiodła się.", 403);
        }
      }
    }

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
      case "password_reset_request":
        // Don't retry password reset requests - verification failures shouldn't be retried
        return await handlePasswordResetRequest(body, trackingId);
      case "password_reset_confirm":
        return await processWithRetry(
          () => handlePasswordResetConfirm(body, trackingId),
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
            body: { ...body, password: body.password ? "[REDACTED]" : undefined, turnstileToken: body.turnstileToken ? "[REDACTED]" : undefined },
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
