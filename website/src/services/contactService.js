import { fetchApi } from './api';

/**
 * Service to submit contact and consultation requests to backend
 */
export const contactService = {
  /**
   * Submit contact form query
   */
  submitContactQuery: async (formData) => {
    return fetchApi('/contact/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  /**
   * Book consultation request
   */
  bookConsultation: async (consultationData) => {
    return fetchApi('/consultation/book', {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  },
};
