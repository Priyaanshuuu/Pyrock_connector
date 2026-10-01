import { materialBalanceResultSchema } from "@/lib/contracts";
import { createToolPostHandler } from "@/lib/http/tool-route";
import { getMaterialBalance } from "@/lib/tools/material-balance";

export const POST = createToolPostHandler(getMaterialBalance, materialBalanceResultSchema);
