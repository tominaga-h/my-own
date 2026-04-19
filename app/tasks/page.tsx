"use client";

import useSWR from "swr";

import TasksView from "./TasksView";
import { ApiError } from "../../lib/api-client";
import type { TaskListResponse } from "../../lib/my-task-sync";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "認証エラー: API キーを確認してください。";
    }
    if (error.status === 502) {
      return "my-task-sync に到達できません。ローカルサーバーが起動しているか確認してください。";
    }
  }
  return "タスクの取得に失敗しました。";
}

export default function TasksPage() {
  const { data, isLoading, error } = useSWR<TaskListResponse>("/api/tasks");

  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        {error ? (
          <div className="rounded-2xl border border-red-200/60 bg-red-50/60 px-5 py-4 text-sm text-red-600">
            {errorMessage(error)}
          </div>
        ) : isLoading && !data ? (
          <div className="rounded-2xl border border-[#e6e8ea]/60 bg-[#ffffff]/70 px-5 py-4 text-sm text-[#464555]/50">
            Loading tasks...
          </div>
        ) : (
          <TasksView tasks={data?.tasks ?? []} />
        )}
      </div>
    </main>
  );
}
