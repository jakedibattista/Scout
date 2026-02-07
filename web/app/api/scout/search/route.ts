export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return Response.json({
      ok: true,
      parsedFilters: { sport: "lacrosse", state: "MD" },
      results: [
        { id: "jordan-wells", name: "Jordan Wells", grade: "A-" },
        { id: "kai-thompson", name: "Kai Thompson", grade: "B+" },
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
