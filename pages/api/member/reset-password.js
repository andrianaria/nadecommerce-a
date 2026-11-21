import { resetMemberPassword } from "@/lib/member-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const language = req.body?.language || "id";
    const member = await resetMemberPassword(
      req.body?.token || "",
      req.body?.password || "",
      language
    );
    return res.status(200).json({
      ok: true,
      member,
      message:
        language === "en"
          ? "Password updated successfully. Please log in with your new password."
          : "Password berhasil diperbarui. Silakan login dengan password baru."
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Gagal memperbarui password."
    });
  }
}
