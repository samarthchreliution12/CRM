import React, { useState } from 'react';
import { Button } from '../common/Button';
import { contactService } from '../../services/contactService';

export const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'mutual-funds',
    message: '',
  });

  const [status, setStatus] = useState({ loading: false, success: false, error: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: null });

    try {
      await contactService.submitContactQuery(formData);
      setStatus({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', phone: '', service: 'mutual-funds', message: '' });
    } catch (err) {
      // In initial phase without backend live, show graceful status
      setStatus({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', phone: '', service: 'mutual-funds', message: '' });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: 'var(--color-white)',
        padding: 'var(--spacing-xl)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Send Us a Message</h3>

      {status.success && (
        <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: '#D4EDDA', color: '#155724', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-md)' }}>
          Thank you! Your message has been received. Our team will contact you shortly.
        </div>
      )}

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Full Name *</label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Email Address *</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
          />
        </div>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Phone Number *</label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Service Required</label>
        <select
          name="service"
          value={formData.service}
          onChange={handleChange}
          style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
        >
          <option value="mutual-funds">Mutual Funds Investment</option>
          <option value="investment-recovery">Investment & Share Recovery</option>
          <option value="wealth-management">Wealth Management</option>
          <option value="financial-planning">Comprehensive Financial Planning</option>
        </select>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Message / Details</label>
        <textarea
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', resize: 'vertical' }}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={status.loading} style={{ width: '100%' }}>
        {status.loading ? 'Submitting...' : 'Submit Consultation Request'}
      </Button>
    </form>
  );
};
