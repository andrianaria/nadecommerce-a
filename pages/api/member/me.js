import { getMemberSession } from "@/lib/member-auth";

export default async function handler(req, res) {
  const session = await getMemberSession(req);
  return res.status(200).json({
    member: session?.member || null
  });
}
