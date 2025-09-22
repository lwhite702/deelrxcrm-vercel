import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import * as functions from "@/lib/inngest/functions";

// Create an array of all functions
const inngestFunctions = Object.values(functions);

// Create the handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
