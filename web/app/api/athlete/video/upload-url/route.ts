export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return Response.json({
      ok: true,
      uploadUrl: "https://storage.googleapis.com/placeholder-bucket/upload",
      payload,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
