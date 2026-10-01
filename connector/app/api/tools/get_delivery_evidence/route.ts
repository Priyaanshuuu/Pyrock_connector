import { deliveryEvidenceResultSchema } from "@/lib/contracts";
import { createToolPostHandler } from "@/lib/http/tool-route";
import { getDeliveryEvidence } from "@/lib/tools/delivery-evidence";

export const POST = createToolPostHandler(getDeliveryEvidence, deliveryEvidenceResultSchema);
