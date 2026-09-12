import React, { useState } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../services/alerts';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/contact', form);
      setForm({ name: '', email: '', subject: '', message: '' });
      await showSuccess('Your message has been sent.');
    } catch (error) { await showError(error.response?.data?.message || 'Unable to send your message.'); } finally { setSaving(false); }
  };
  const inputClass = 'w-full rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-4 py-3 text-white outline-none focus:border-[#3b82f6]';
  return <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white"><div className="mx-auto max-w-3xl"><header className="mb-8"><p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Get in touch</p><h1 className="mt-3 text-4xl font-bold">Contact HazardWatch</h1><p className="mt-3 text-gray-400">Send the team a question about reports, accounts, or the platform.</p></header><form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 md:p-8">{[['name', 'Name', 'text'], ['email', 'Email', 'email'], ['subject', 'Subject', 'text']].map(([key, label, type]) => <label key={key} className="block text-sm text-gray-300">{label}<input required type={type} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className={`${inputClass} mt-2`} /></label>)}<label className="block text-sm text-gray-300">Message<textarea required minLength={10} rows="6" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} className={`${inputClass} mt-2 resize-y`} /></label><button type="submit" disabled={saving} className="rounded-xl bg-[#3b82f6] px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Sending...' : 'Send message'}</button></form></div></main>;
};
export default ContactPage;
