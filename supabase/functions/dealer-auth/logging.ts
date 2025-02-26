
export interface AuthLogEvent {
  type: "AUTH_EVENT"
  action: string
  email: string
  timestamp: string
  status: "success" | "failure"
  error?: string
  metadata: {
    user_agent?: string | null
    ip?: string | null
  }
}

export function logAuthEvent(
  req: Request,
  action: string,
  email: string,
  status: "success" | "failure",
  error?: string
) {
  const event: AuthLogEvent = {
    type: "AUTH_EVENT",
    action,
    email,
    timestamp: new Date().toISOString(),
    status,
    ...(error && { error }),
    metadata: {
      user_agent: req.headers.get("user-agent"),
      ip: req.headers.get("cf-connecting-ip")
    }
  }
  
  console.log(JSON.stringify(event))
}
