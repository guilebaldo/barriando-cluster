import { prisma } from "@/lib/prisma";
import { getLiveStats, type LiveStats } from "@/lib/get-live-stats";

export type AdminOverviewStats = LiveStats & {
  totalUsers: number;
  usersLast30Days: number;
  ticketsIssued: number;
  publishedEvents: number;
  siteVisitors30d: number | null;
  sitePageviews30d: number | null;
};

async function fetchSiteVisits30d(): Promise<{
  visitors: number;
  pageviews: number;
} | null> {
  const token = process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;

  const teamId = process.env.VERCEL_ORG_ID;
  const until = new Date();
  const since = new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000);
  const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/count");
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("since", since.toISOString());
  url.searchParams.set("until", until.toISOString());
  if (teamId) url.searchParams.set("teamId", teamId);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data?: { visitors?: number; pageviews?: number };
    };
    const visitors = body.data?.visitors;
    const pageviews = body.data?.pageviews;
    if (typeof visitors !== "number" && typeof pageviews !== "number") return null;
    return {
      visitors: typeof visitors === "number" ? visitors : 0,
      pageviews: typeof pageviews === "number" ? pageviews : 0,
    };
  } catch {
    return null;
  }
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [live, totalUsers, usersLast30Days, ticketsIssued, publishedEvents, visits] =
    await Promise.all([
      getLiveStats(),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.accessTicket.count(),
      prisma.accessEvent.count({ where: { published: true } }),
      fetchSiteVisits30d(),
    ]);

  return {
    ...live,
    totalUsers,
    usersLast30Days,
    ticketsIssued,
    publishedEvents,
    siteVisitors30d: visits?.visitors ?? null,
    sitePageviews30d: visits?.pageviews ?? null,
  };
}
