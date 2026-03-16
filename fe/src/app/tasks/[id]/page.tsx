import TaskForm from '@/components/task-form';

export default async function EditTaskPage({ params }: { params: { id: string } }) {
  // Await params if Next.js > 14 requires it in App Router
  const p = await params;
  return <TaskForm taskId={p.id} />;
}
