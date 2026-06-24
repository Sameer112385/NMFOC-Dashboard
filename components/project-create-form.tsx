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
    setProjectCode('');
    setProjectName('');
    setClientName('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`overflow-hidden ${surfaceCard}`}>
      <div className="border-b border-line/70 px-5 py-4">
        <div className="section-kicker text-muted">Create Project</div>
        <div className="mt-2 text-sm text-muted">Start a new project workspace with a clean commercial and financial control structure.</div>
      </div>
      <div className="grid gap-3 px-5 py-5 md:grid-cols-3">
        <input className="rounded-2xl border border-line/80 bg-panel px-4 py-3 text-sm text-text outline-none placeholder:text-muted/70 focus:border-accent/50" placeholder="Project code" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} />
        <input className="rounded-2xl border border-line/80 bg-panel px-4 py-3 text-sm text-text outline-none placeholder:text-muted/70 focus:border-accent/50" placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        <input className="rounded-2xl border border-line/80 bg-panel px-4 py-3 text-sm text-text outline-none placeholder:text-muted/70 focus:border-accent/50" placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line/70 px-5 py-4">
        <button className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-glow">Create project</button>
        {message ? <span className="text-sm text-muted">{message}</span> : null}
      </div>
    </form>
  );
}
