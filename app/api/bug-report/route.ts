const REPO = "crafter-station/cs.chat";

export async function POST(req: Request) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { error: "GitHub integration not configured" },
      { status: 503 }
    );
  }

  const { title, body } = (await req.json()) as {
    title: string;
    body: string;
  };

  if (!title?.trim() || !body?.trim()) {
    return Response.json({ error: "Title and body are required" }, { status: 400 });
  }

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: title.trim(),
      body: body.trim(),
      labels: ["bug"],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json(
      { error: "Failed to create issue", detail: err },
      { status: res.status }
    );
  }

  const issue = (await res.json()) as { html_url: string; number: number };
  return Response.json({ url: issue.html_url, number: issue.number });
}
