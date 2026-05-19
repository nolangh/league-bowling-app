import nodemailer from "nodemailer";
import { logger } from "./logger";

export type ReportSchedule = "weekly" | "monthly";

export interface ReportData {
  username: string;
  name: string;
  careerAvg: number;
  highGame: number;
  totalGames: number;
  wins: number;
  losses: number;
  bsr: number;
  rank: string;
  recentGames: Array<{
    date: string;
    score: number;
    alley: string;
    oilPattern: string;
    ballUsed: string;
    verified: boolean;
  }>;
  schedule: ReportSchedule;
}

/** Escape a string for safe CSV inclusion: quote if needed, strip formula prefix. */
function csvCell(value: string): string {
  // Prevent spreadsheet formula injection: neutralise leading = + - @ \t \r
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  // RFC 4180: wrap in double-quotes if the value contains comma, quote, or newline
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/** Escape a string for safe HTML inclusion. */
function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildCsv(data: ReportData): string {
  const lines: string[] = [];

  lines.push("# Player Stats");
  lines.push("Field,Value");
  lines.push(`Career Average,${data.careerAvg}`);
  lines.push(`High Game,${data.highGame}`);
  lines.push(`Total Games,${data.totalGames}`);
  lines.push(`BSR Rating,${data.bsr}`);
  lines.push(`Rank,${csvCell(data.rank)}`);
  lines.push(`Wins,${data.wins}`);
  lines.push(`Losses,${data.losses}`);
  const total = data.wins + data.losses;
  const winRate = total > 0 ? Math.round((data.wins / total) * 100) : 0;
  lines.push(`Win Rate (%),${winRate}`);
  lines.push("");

  if (data.recentGames.length > 0) {
    lines.push("# Recent Games");
    lines.push("Date,Score,Alley,Oil Pattern,Ball Used,Verified");
    for (const g of data.recentGames) {
      lines.push(
        [
          csvCell(g.date),
          String(g.score),
          csvCell(g.alley),
          csvCell(g.oilPattern),
          csvCell(g.ballUsed),
          g.verified ? "Yes" : "No",
        ].join(","),
      );
    }
  }

  return lines.join("\n");
}

function buildHtml(data: ReportData): string {
  const periodLabel = data.schedule === "weekly" ? "Weekly" : "Monthly";
  const total = data.wins + data.losses;
  const winRate = total > 0 ? Math.round((data.wins / total) * 100) : 0;

  const recentRows = data.recentGames
    .slice(0, 5)
    .map(
      (g) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e8de;">${escHtml(g.date)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e8de;font-weight:700;color:#0e0f0c;">${g.score}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e8de;">${escHtml(g.alley)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e8de;">${escHtml(g.oilPattern)}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your ${escHtml(periodLabel)} Bowling Report</title></head>
<body style="font-family:Inter,sans-serif;background:#f0f0e8;margin:0;padding:32px 0;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="background:#1a1a16;border-radius:16px;padding:28px 32px;margin-bottom:16px;">
      <div style="font-size:12px;color:#9fe870;font-weight:700;letter-spacing:1px;margin-bottom:8px;">LEAGUE · ${escHtml(periodLabel.toUpperCase())} STAT REPORT</div>
      <div style="font-size:26px;font-weight:700;color:#ffffff;">Hi ${escHtml(data.name)},</div>
      <div style="font-size:14px;color:#a0a09a;margin-top:6px;">Here's your ${periodLabel.toLowerCase()} performance summary. Full data is attached as a CSV.</div>
    </div>

    <div style="background:#ffffff;border-radius:16px;padding:24px 32px;margin-bottom:16px;">
      <div style="font-size:11px;color:#888;font-weight:700;letter-spacing:0.8px;margin-bottom:16px;">CAREER STATS</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:32px;font-weight:700;color:#0e0f0c;">${data.careerAvg}</div>
            <div style="font-size:11px;color:#888;font-weight:600;">CAREER AVG</div>
          </td>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:32px;font-weight:700;color:#0e0f0c;">${data.highGame}</div>
            <div style="font-size:11px;color:#888;font-weight:600;">HIGH GAME</div>
          </td>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:32px;font-weight:700;color:#0e0f0c;">${data.totalGames}</div>
            <div style="font-size:11px;color:#888;font-weight:600;">TOTAL GAMES</div>
          </td>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:32px;font-weight:700;color:#9fe870;">${data.bsr}</div>
            <div style="font-size:11px;color:#888;font-weight:600;">BSR RATING</div>
          </td>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:32px;font-weight:700;color:#0e0f0c;">${winRate}%</div>
            <div style="font-size:11px;color:#888;font-weight:600;">WIN RATE</div>
          </td>
        </tr>
      </table>
    </div>

    ${
      recentRows
        ? `<div style="background:#ffffff;border-radius:16px;padding:24px 32px;margin-bottom:16px;">
      <div style="font-size:11px;color:#888;font-weight:700;letter-spacing:0.8px;margin-bottom:16px;">RECENT GAMES</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#555;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #e8e8de;color:#888;">DATE</th>
            <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #e8e8de;color:#888;">SCORE</th>
            <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #e8e8de;color:#888;">ALLEY</th>
            <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #e8e8de;color:#888;">OIL PATTERN</th>
          </tr>
        </thead>
        <tbody>${recentRows}</tbody>
      </table>
    </div>`
        : ""
    }

    <div style="font-size:12px;color:#aaa;text-align:center;padding:16px 0;">
      You're receiving this because you enabled ${periodLabel.toLowerCase()} stat reports on League.<br>
      To change your schedule, open the League app → Profile → Scheduled Reports.
    </div>
  </div>
</body>
</html>`;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM_ADDRESS = process.env.SMTP_FROM ?? "League <noreply@league.app>";

export async function sendReportEmail(
  toEmail: string,
  data: ReportData,
): Promise<void> {
  const csv = buildCsv(data);
  const html = buildHtml(data);
  const periodLabel = data.schedule === "weekly" ? "Weekly" : "Monthly";
  const subject = `Your ${periodLabel} Bowling Report — League`;
  const filename = `league_stats_${data.username}_${new Date().toISOString().slice(0, 10)}.csv`;

  const transporter = createTransporter();

  if (!transporter) {
    // Throw so callers know the send failed and must not record it as delivered.
    // Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally SMTP_FROM)
    // to enable real email delivery. Any SMTP provider (e.g. Resend, SendGrid,
    // Mailgun, Postmark, or a self-hosted server) works.
    throw new Error(
      "[reportEmail] SMTP not configured — set SMTP_HOST / SMTP_USER / SMTP_PASS. Report not sent.",
    );
  }

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: toEmail,
    subject,
    html,
    attachments: [
      {
        filename,
        content: Buffer.from(csv, "utf-8"),
        contentType: "text/csv",
      },
    ],
  });

  logger.info({ to: toEmail, subject }, "[reportEmail] Stat report email sent");
}
