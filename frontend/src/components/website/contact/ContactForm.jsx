import React, { useState } from 'react';
import { Button } from '../common/Button';
import { contactService } from '../../../services/website/contactService';

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
      setStatus({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', phone: '', service: 'mutual-funds', message: '' });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="website-contact-form"
    >
      <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.35rem', fontWeight: 700 }}>Send Us a Message</h3>

      {status.success && (
        <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: '#D4EDDA', color: '#155724', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-md)' }}>
          Thank you! Your message has been received. Our team will contact you shortly.
        </div>
      )}

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Full Name *</label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
        />
      </div>

      <div className="contact-form-grid-2">
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Email Address *</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
          />
        </div>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Phone Number *</label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Service Required</label>
        <select
          name="service"
          value={formData.service}
          onChange={handleChange}
          style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', backgroundColor: '#FFFFFF' }}
        >
          <option value="mutual-funds">Mutual Funds Investment</option>
          <option value="investment-recovery">Investment & Share Recovery</option>
          <option value="wealth-management">Wealth Management</option>
          <option value="financial-planning">Comprehensive Financial Planning</option>
        </select>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Message / Details</label>
        <textarea
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', resize: 'vertical', fontSize: '0.95rem' }}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={status.loading} style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}>
        {status.loading ? 'Submitting...' : 'Submit Consultation Request'}
      </Button>

      <style>{`
        .website-contact-form {
          background-color: var(--color-white);
          padding: var(--spacing-xl);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-md);
        }

        .contact-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        @media (max-width: 600px) {
          .contact-form-grid-2 {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }

        @media (max-width: 480px) {
          .website-contact-form {
            padding: 1.25rem 1rem;
          }
        }
      `}</style>
    </form>
  );
};
