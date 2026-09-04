import api from "../api/axios";

const submitFeedback = async ({ subject, message }) => {
  const { data } = await api.post("/feedback", { subject, message });
  return data.feedback;
};

export default { submitFeedback };
