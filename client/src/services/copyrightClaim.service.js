import api from "../api/axios";

const copyrightClaimService = {
  async getCreatorClaims() {
    const { data } = await api.get("/copyright/claims");
    return data;
  },

  async submitDispute(claimId, payload) {
    const { data } = await api.post(`/copyright/claims/${claimId}/disputes`, payload);
    return data;
  },
};

export default copyrightClaimService;