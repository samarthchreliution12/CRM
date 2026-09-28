import { fetchApi } from './api';

export const contactService = {
  submitContactQuery: async (formData) => {
    return fetchApi('/public/leads', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  bookConsultation: async (consultationData) => {
    return fetchApi('/public/leads', {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  },
};
