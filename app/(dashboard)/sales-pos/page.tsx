import { Metadata } from "next";
import SalesPOSClient from "./SalesPOSClient";

export const metadata: Metadata = {
  title: "Sales POS | CRM",
  description: "Point of sale for creating orders",
};

export default function SalesPOSPage() {
  return <SalesPOSClient />;
}
