export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return Response.json({
      ok: true,
      status: "uploaded",
      payload,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
