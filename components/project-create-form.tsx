"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { surfaceCard } from '@/components/ui';

export function ProjectCreateForm() {
  const router = useRouter();
  const [projectCode, setProjectCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const formData = new FormData();
    formData.set('project_code', projectCode);
    formData.set('project_name', projectName);
    formData.set('client_name', clientName);

    const response = await fetch('/api/projects', { method: 'POST', body: formData });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? 'Unable to create project.');
      return;
    }

    setMessage('Project created successfully.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`p-5 ${surfaceCard}`}>
      <h3 className="text-lg font-semibold text-text">Create Project</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input className="rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text" placeholder="Project code" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} />
        <input className="rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text" placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        <input className="rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text" placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg">Save project</button>
        {message ? <span className="text-sm text-muted">{message}</span> : null}
      </div>
    </form>
  );
}
