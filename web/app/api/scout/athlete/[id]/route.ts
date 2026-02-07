type RouteContext = {
  params: { id: string };
};

export async function GET(request: Request, context: RouteContext) {
  const athleteId = context.params.id;
  return Response.json({
    ok: true,
    athlete: {
      id: athleteId,
      name: athleteId.replace("-", " "),
    },
  });
}
