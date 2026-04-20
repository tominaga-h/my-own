"use client";

import useSWR from "swr";

import TasksSkeleton from "./TasksSkeleton";
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

  if (isLoading && !data) {
    return <TasksSkeleton />;
  }

  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <TasksView
          rows={data?.rows ?? []}
          remindsMap={data?.remindsMap ?? {}}
          projectMap={data?.projectMap ?? {}}
        />
      </div>
    </main>
  );
}
