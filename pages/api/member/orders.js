import { getMemberSession } from "@/lib/member-auth";
import { listOrdersByCustomer } from "@/lib/order-store";

export default async function handler(req, res) {
  const session = await getMemberSession(req);

  if (!session?.member) {
    return res.status(401).json({ error: "Member login required." });
  }

  const orders = await listOrdersByCustomer({
    phone: session.member.phone,
    email: session.member.email
  });

  return res.status(200).json({ orders });
}
