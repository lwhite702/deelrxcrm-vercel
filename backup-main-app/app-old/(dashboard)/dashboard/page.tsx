import { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | CRM",
  description: "Overview of your CRM performance and key metrics",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
