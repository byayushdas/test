import { fetchApi } from "../api";

export const blockchainService = {
  async getBlockchainLogs() {
    return fetchApi("/blockchain-logs");
  },

  async getBatchTraceability(batchId: string) {
    return fetchApi(`/trace/${batchId}`);
  },
};
