"use client";

import useSWR from "swr";

import TasksView from "./TasksView";

type TasksResponse = {
  rows: Array<{
    id: number;
    userId: string;
    title: string;
    status: string;
    source: string;
    important: boolean;
    projectId: number | null;
    due: string | null;
    doneAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  remindsMap: Record<number, string[]>;
  projectMap: Record<number, string>;
};

export default function TasksPage() {
  const { data, isLoading } = useSWR<TasksResponse>("/api/tasks");

  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        {isLoading && !data ? (
          <div className="rounded-2xl border border-[#e6e8ea]/60 bg-[#ffffff]/70 px-5 py-4 text-sm text-[#464555]/50">
            Loading tasks...
          </div>
        ) : (
          <TasksView
            rows={data?.rows ?? []}
            remindsMap={data?.remindsMap ?? {}}
            projectMap={data?.projectMap ?? {}}
          />
        )}
      </div>
    </main>
  );
}
