import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Task,
  useProjects,
  useTasks,
  useAddProject,
  useAddTask,
  useUpdateTask,
  useDeleteTask,
} from "../hooks/useProject&Task";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  project_id: z.string().min(1, "Project is required"),
});

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const projectForm = useForm<{ name: string }>({
    resolver: zodResolver(projectSchema),
  });

  const taskForm = useForm<{ name: string; description?: string; project_id: string }>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (editingTask) {
      taskForm.reset({
        name: editingTask.name,
        description: editingTask.description || "",
        project_id: editingTask.project_id,
      });
    } else {
      taskForm.reset({
        name: "",
        description: "",
        project_id: "",
      });
    }
  }, [editingTask, taskForm]);

  const { data: projects } = useProjects(session);
  const { data: tasks } = useTasks(session);

  const addProject = useAddProject(() => projectForm.reset());
  const addTask = useAddTask(() => taskForm.reset());
  const updateTask = useUpdateTask(() => {
    setEditingTask(null);
    taskForm.reset();
  });
  const deleteTask = useDeleteTask();

  if (loading) return <div className="p-6 text-center">Loading session...</div>;
  if (!session) return <div className="p-6 text-center">Not logged in</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold text-center">User Dashboard</h1>

      {/* Project Form */}
      <form
        onSubmit={projectForm.handleSubmit((values) => addProject.mutate(values))}
        className="bg-white shadow-md rounded p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Create Project</h2>
        <input
          {...projectForm.register("name")}
          className="border p-2 w-full mb-2 rounded"
          placeholder="Project Name"
        />
        {projectForm.formState.errors.name && (
          <p className="text-red-500 text-sm">
            {projectForm.formState.errors.name.message}
          </p>
        )}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add Project
        </button>
      </form>

      {/* Task Form */}
      <form
        onSubmit={taskForm.handleSubmit((values) => {
          if (editingTask) {
            updateTask.mutate({
              ...values as Task,
              id: editingTask.id,
            });
          } else {
            addTask.mutate(values as Task);
          }
        })}
        className="bg-white shadow-md rounded p-6"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editingTask ? "Edit Task" : "Create Task"}
        </h2>
        <input
          {...taskForm.register("name")}
          className="border p-2 w-full mb-2 rounded"
          placeholder="Task Name"
        />
        {taskForm.formState.errors.name && (
          <p className="text-red-500 text-sm">
            {taskForm.formState.errors.name.message}
          </p>
        )}

        <textarea
          {...taskForm.register("description")}
          className="border p-2 w-full mb-2 rounded"
          placeholder="Task Description (optional)"
        />
        {taskForm.formState.errors.description && (
          <p className="text-red-500 text-sm">
            {taskForm.formState.errors.description.message}
          </p>
        )}

        <select
          {...taskForm.register("project_id")}
          className="border p-2 w-full mb-2 rounded"
        >
          <option value="">Select Project</option>
          {projects?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {taskForm.formState.errors.project_id && (
          <p className="text-red-500 text-sm">
            {taskForm.formState.errors.project_id.message}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className={`${
              editingTask
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white px-4 py-2 rounded`}
          >
            {editingTask ? "Update Task" : "Add Task"}
          </button>
          {editingTask && (
            <button
              type="button"
              onClick={() => setEditingTask(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Project List */}
      <div className="bg-white shadow-md rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
        {projects?.length ? (
          <ul className="list-disc pl-6 space-y-1">
            {projects.map((project) => (
              <li key={project.id}>{project.name}</li>
            ))}
          </ul>
        ) : (
          <p>No projects found.</p>
        )}
      </div>

      {/* Task List */}
      <div className="bg-white shadow-md rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
        <ul className="space-y-2">
          {tasks?.map((task) => {
            const project = projects?.find((p) => p.id === task.project_id);
            return (
              <li
                key={task.id}
                className="border rounded p-2 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{task.name}</p>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  {project && (
                    <p className="text-xs text-gray-500">
                      Project: {project.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
