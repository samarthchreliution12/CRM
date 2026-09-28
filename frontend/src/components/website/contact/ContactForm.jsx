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
    if (status.loading) return;

    setStatus({ loading: true, success: false, error: null });

    try {
      await contactService.submitContactQuery(formData);
      setStatus({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', phone: '', service: 'mutual-funds', message: '' });
    } catch (err) {
      console.error('Contact form submission error:', err);
      const friendlyMessage =
        err?.message && !err.message.includes('500') && !err.message.includes('Internal')
          ? err.message
          : 'Unable to submit your request at this time. Please check your information or try again.';
      setStatus({
        loading: false,
        success: false,
        error: friendlyMessage,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="website-contact-form"
    >
      <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.35rem', fontWeight: 700 }}>Send Us a Message</h3>

      {status.success && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: '#D4EDDA',
            color: '#155724',
            border: '1px solid #C3E6CB',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-md)',
            fontWeight: 500,
            fontSize: '0.95rem',
          }}
        >
          ✓ Thank you! Your consultation request has been submitted successfully.
        </div>
      )}

      {status.error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: '#F8D7DA',
            color: '#721C24',
            border: '1px solid #F5C6CB',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-md)',
            fontWeight: 500,
            fontSize: '0.95rem',
          }}
        >
          ⚠️ {status.error}
        </div>
      )}

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Full Name *</label>
        <input
          type="text"
          name="name"
          required
          minLength={2}
          maxLength={150}
          placeholder="e.g. Rahul Shah"
          value={formData.name}
          onChange={handleChange}
          disabled={status.loading}
          style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
      </div>

      <div className="contact-form-grid-2">
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Email Address *</label>
          <input
            type="email"
            name="email"
            required
            maxLength={150}
            placeholder="e.g. rahul@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={status.loading}
            style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Phone Number *</label>
          <input
            type="tel"
            name="phone"
            required
            minLength={7}
            maxLength={20}
            placeholder="e.g. +91 9876543210"
            value={formData.phone}
            onChange={handleChange}
            disabled={status.loading}
            style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Service Required *</label>
        <select
          name="service"
          value={formData.service}
          onChange={handleChange}
          disabled={status.loading}
          style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', backgroundColor: '#FFFFFF', boxSizing: 'border-box' }}
        >
          <option value="mutual-funds">Mutual Funds Investment</option>
          <option value="demat">Demat Account</option>
          <option value="ipo">IPO & Primary Markets</option>
          <option value="physical-shares">Physical Shares & Demat Conversion</option>
          <option value="iepf">IEPF Share & Dividend Recovery</option>
          <option value="insurance">Life & Health Insurance</option>
          <option value="trading">Equity & Derivatives Trading</option>
          <option value="pms">Portfolio Management Services (PMS)</option>
          <option value="aif">Alternative Investment Funds (AIF)</option>
          <option value="slbm">Securities Lending & Borrowing (SLBM)</option>
          <option value="wealth-management">Wealth Management & Financial Planning</option>
        </select>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>Message / Details</label>
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Tell us about your requirements or investment queries..."
          value={formData.message}
          onChange={handleChange}
          disabled={status.loading}
          style={{ width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', resize: 'vertical', fontSize: '0.95rem', boxSizing: 'border-box' }}
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
