export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return Response.json({
      ok: true,
      reports: [
        { type: "scout", summary: "Placeholder scout report." },
        { type: "research", summary: "Placeholder research report." },
        { type: "coach", summary: "Placeholder coaching report." },
      ],
      payload,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
