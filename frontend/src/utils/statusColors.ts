import type { TaskStatus } from '@/types';

const statusDotMap: Record<TaskStatus, string> = {
  backlog: 'bg-gray-400',
  todo: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  review: 'bg-purple-500',
  done: 'bg-green-500',
};

const statusStrokeMap: Record<TaskStatus, string> = {
  backlog: '#9ca3af',
  todo: '#3b82f6',
  in_progress: '#eab308',
  review: '#a855f7',
  done: '#22c55e',
};

export function getStatusDotClass(status: TaskStatus): string {
  return statusDotMap[status] || 'bg-gray-400';
}

export function getStatusStroke(status: TaskStatus): string {
  return statusStrokeMap[status] || '#9ca3af';
}