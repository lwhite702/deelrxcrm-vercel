import { Metadata } from "next";
import PaymentsClient from "./PaymentsClient";

export const metadata: Metadata = {
  title: "Payments | CRM",
  description: "Payment management and refunds",
};

export default function PaymentsPage() {
  return <PaymentsClient />;
}