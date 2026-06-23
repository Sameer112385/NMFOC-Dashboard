"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DarkSelect } from '@/components/dark-select';
import { surfaceCard } from '@/components/ui';

export function CommentForm({ projects, revenueWbs }: { projects: { id: string; project_name: string }[]; revenueWbs: { code: string }[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [wbsCode, setWbsCode] = useState(revenueWbs[0]?.code ?? '');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/comments', { method: 'POST', body: formData });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? 'Unable to save comment.');
      return;
    }
    setMessage('Comment saved.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`p-5 ${surfaceCard}`}>
      <h3 className="text-lg font-semibold text-text">Add Comment</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <DarkSelect
          name="project_id"
          value={projectId}
          onChange={setProjectId}
          placeholder="Select project"
          options={projects.map((project) => ({ value: project.id, label: project.project_name }))}
        />
        <DarkSelect
          name="wbs_code"
          value={wbsCode}
          onChange={setWbsCode}
          placeholder="Select WBS"
          options={revenueWbs.map((item) => ({ value: item.code, label: item.code }))}
        />
        <input name="created_by" placeholder="Created by" className="rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text" />
        <textarea name="comment_text" placeholder="Comment text" className="min-h-24 rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text md:col-span-2" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg">Save comment</button>
        {message ? <span className="text-sm text-muted">{message}</span> : null}
      </div>
    </form>
  );
}
