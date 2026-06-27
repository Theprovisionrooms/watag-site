// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /api/staff/stats?staffId=1
// Owner only. One honest note: there's no "mark this reward as
// actually handed over" action built anywhere yet, so this reports
// stamps issued and rewards currently sitting pending, not a
// historical redemption count, that table exists in the schema but
// nothing writes to it yet.

import { isOwner } from "../../_lib/session.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const staffId = url.searchParams.get("staffId");

  if (!(await isOwner(env, staffId))) {
    return new Response(JSON.stringify({ error: "owner_only" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const db = env.WATAG_DB;

  const revenue = await db.prepare(
    `SELECT COALESCE(SUM(total_cents), 0) AS total_cents, COUNT(*) AS orders_count FROM orders WHERE status = 'paid'`
  ).first();

  const topProducts = await db.prepare(
    `SELECT p.name, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.price_cents) AS revenue_cents
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.status = 'paid'
     GROUP BY oi.product_id
     ORDER BY qty DESC
     LIMIT 5`
  ).all();

  const clients = await db.prepare(`SELECT COUNT(*) AS total FROM clients`).first();
  const newClientsThisMonth = await db.prepare(
    `SELECT COUNT(*) AS total FROM clients WHERE created_at >= date('now', 'start of month')`
  ).first();

  const stampsTotal = await db.prepare(`SELECT COUNT(*) AS total FROM loyalty_stamp_log`).first();
  const stampsThisMonth = await db.prepare(
    `SELECT COUNT(*) AS total FROM loyalty_stamp_log WHERE created_at >= date('now', 'start of month')`
  ).first();
  const pendingRewards = await db.prepare(
    `SELECT pending_reward, COUNT(*) AS total FROM loyalty_cards WHERE pending_reward IS NOT NULL GROUP BY pending_reward`
  ).all();

  const enquiryThreads = await db.prepare(`SELECT COUNT(*) AS total FROM enquiry_threads`).first();
  const messagesThisWeek = await db.prepare(
    `SELECT COUNT(*) AS total FROM enquiry_messages WHERE created_at >= date('now', '-7 days')`
  ).first();

  const reviewNudges = await db.prepare(
    `SELECT COUNT(*) AS sent, SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked FROM review_nudges`
  ).first();

  const waitlist = await db.prepare(`SELECT COUNT(*) AS total FROM waitlist`).first();

  return new Response(
    JSON.stringify({
      revenue: { totalCents: revenue.total_cents, ordersCount: revenue.orders_count },
      topProducts: topProducts.results,
      clients: { total: clients.total, newThisMonth: newClientsThisMonth.total },
      loyalty: {
        stampsTotal: stampsTotal.total,
        stampsThisMonth: stampsThisMonth.total,
        pendingRewards: pendingRewards.results,
      },
      enquiries: { threadCount: enquiryThreads.total, messagesThisWeek: messagesThisWeek.total },
      reviewNudges: { sent: reviewNudges.sent || 0, clicked: reviewNudges.clicked || 0 },
      waitlist: { open: waitlist.total },
    }),
    { headers: { "content-type": "application/json" } }
  );
}
