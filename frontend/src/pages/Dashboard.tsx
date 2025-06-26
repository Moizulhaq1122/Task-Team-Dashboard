import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Task, type Project, useProjects, useTasks, useAddProject, useAddTask, useUpdateTask, useDeleteTask } from "../hooks/useProject&Task";
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Controlled task inputs (your style)
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");

  const queryClient = useQueryClient();

  const projectForm = useForm<{ name: string }>({
    resolver: zodResolver(projectSchema),
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
      setTaskName(editingTask.name);
      setTaskDescription(editingTask.description || "");
      setTaskProjectId(editingTask.project_id);
    }
  }, [editingTask]);

  const { data: projects } = useProjects(session);

  const { data: tasks } = useTasks(session);

  const addProject = useAddProject(() => {
    projectForm.reset();
  });

  const addTask = useAddTask(() => {
    resetTaskForm();
  });

  const updateTask = useUpdateTask(() => {
    resetTaskForm();
  });

  const deleteTask = useDeleteTask();

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const resetTaskForm = () => {
    setEditingTask(null);
    setTaskName("");
    setTaskDescription("");
    setTaskProjectId("");
  };

  if (loading) return <div className="p-6 text-center">Loading session...</div>;
  if (!session) return <div className="p-6 text-center">Not logged in</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold text-center">User Dashboard</h1>

      {/* Project Form */}
      <form
        onSubmit={projectForm.handleSubmit((values) =>
          addProject.mutate(values)
        )}
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
        onSubmit={(e) => {
          e.preventDefault();
          if (editingTask) {
            updateTask.mutate(
              {
                id: editingTask.id,
                name: taskName,
                description: taskDescription,
                project_id: taskProjectId,
              } as Task,
            );
          } else {
            addTask.mutate({
              name: taskName,
              description: taskDescription,
              project_id: taskProjectId,
            } as Task);
          }
        }}
        className="bg-white shadow-md rounded p-6"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editingTask ? "Edit Task" : "Create Task"}
        </h2>
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Task Name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
        <textarea
          className="border p-2 w-full mb-2 rounded"
          placeholder="Task Description (optional)"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
        />
        <select
          className="border p-2 w-full mb-2 rounded"
          value={taskProjectId}
          onChange={(e) => setTaskProjectId(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

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
              onClick={resetTaskForm}
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
                    onClick={() => handleEdit(task)}
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
