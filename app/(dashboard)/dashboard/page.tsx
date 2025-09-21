import { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | CRM",
  description: "Overview of your CRM performance and key metrics",
};

/**
 * Renders the DashboardClient component.
 */
export default function DashboardPage() {
  return <DashboardClient />;
}