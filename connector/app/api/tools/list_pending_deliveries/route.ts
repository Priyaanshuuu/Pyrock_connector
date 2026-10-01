import { pendingDeliveriesResultSchema } from "@/lib/contracts";
import { createToolPostHandler } from "@/lib/http/tool-route";
import { listPendingDeliveries } from "@/lib/tools/pending-deliveries";

export const POST = createToolPostHandler(listPendingDeliveries, pendingDeliveriesResultSchema);
