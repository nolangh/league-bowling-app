import { Router, type IRouter } from "express";
import { openrouter } from "@workspace/integrations-openrouter-ai";

const router: IRouter = Router();

router.post("/games/scorecard/analyze", async (req, res): Promise<void> => {
  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const mime = (mimeType ?? "image/jpeg") as string;

  try {
    const response = await openrouter.chat.completions.create({
      model: "google/gemma-3-4b-it",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mime};base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: `You are analyzing a bowling scorecard photo. Extract the per-frame scores for each of the 10 frames.

Return ONLY a JSON object in this exact format, no other text:
{
  "frames": [
    { "ball1": <number 0-10>, "ball2": <number or null if strike>, "ball3": <number or null if not 10th frame bonus> },
    ... (10 frames total)
  ],
  "totalScore": <computed total 0-300>,
  "confidence": <"high"|"medium"|"low">
}

Rules:
- ball1 is 0-10. If it's a strike (10), ball2 is null for frames 1-9.
- ball2 for frames 1-9: 0 to (10 - ball1), null if frame 1-9 is a strike.
- For frame 10 (index 9): up to 3 balls are possible. ball3 is non-null only if ball1 was a strike OR ball1+ball2 = 10.
- If you cannot read a frame clearly, use null for that ball value.
- Compute totalScore using standard bowling scoring (strikes = 10 + next 2 balls, spares = 10 + next ball).
- Set confidence to "low" if the image is blurry or you had to guess more than 2 frames.`,
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(422).json({ error: "Could not extract scorecard data from image" });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      res.status(422).json({ error: "Could not parse scorecard response" });
      return;
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Scorecard analysis failed");
    res.status(500).json({ error: "Scorecard analysis failed" });
  }
});

export default router;
