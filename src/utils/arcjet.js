import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

// Use ARCJET_KEY or ARCJET (adjust to match your .env)
const arcjetKey = process.env.ARCJET_KEY || process.env.ARCJET;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
  throw new Error("ARCJET_KEY is not set in environment variables");
}

export const httpArcjet = arcjet({
  key: arcjetKey,
  rules: [
    shield({
      mode: arcjetMode,
    }),
//  detectBot({
//        mode: arcjetMode,

//       allow: ["CATEGORY:SEARCH_ENGINE", "POSTMAN"]
     
//      }),
slidingWindow({
  mode: arcjetMode,
  interval: "10s",
  max: 50,

}),
  ],
});

export const wsArcjet = arcjet({
  key: arcjetKey,
  rules: [
    shield({
      mode: arcjetMode,
    }),
  //   detectBot({
  //     mode: arcjetMode,
  //  allow: ["CATEGORY:SEARCH_ENGINE", "POSTMAN"]
      
  //   }),
    slidingWindow({
      mode: arcjetMode,
      interval: "2s",
      max: 5,
    }),
  ],
});

export default async function securityMiddleware(req, res, next) {
  if (!httpArcjet) {
    return next();
  }

  try {
   
    const decision = await httpArcjet.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      console.log('Arcjet blocked HTTP request. Reason:', decision.reason);
      if (decision.reason.isRateLimit()) {
        return res
          .status(429)
          .json({ error: "Too many requests, please try again later" });
      }

      return res
        .status(403)
        .json({ error: "Request blocked due to security policy" });
        
    }

    next();
  } catch (error) {
    console.error("Arcjet protection error:", error);
    return res.status(500).json({ error: "Failed to process request" });
  }
}