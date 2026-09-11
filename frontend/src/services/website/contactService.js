import { fetchApi } from './api';

export const contactService = {
  submitContactQuery: async (formData) => {
    return fetchApi('/contact/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  bookConsultation: async (consultationData) => {
    return fetchApi('/consultation/book', {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  },
};
