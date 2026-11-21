import { createAdminCookies, signInAdmin } from "@/lib/admin-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { session, adminProfile } = await signInAdmin(
      req.body.email,
      req.body.password
    );

    res.setHeader("Set-Cookie", createAdminCookies(session));
    return res.status(200).json({
      ok: true,
      admin: {
        email: adminProfile.email,
        fullName: adminProfile.full_name,
        role: adminProfile.role
      }
    });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}
