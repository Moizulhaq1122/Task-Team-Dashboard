// hooks/useTasksAndProjects.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type Project = {
  id: string;
  name: string;
  team_id?: string;
  created_at?: string;
};

export type Task = {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  assigned_to?: string;
  completed: boolean;
  created_at?: string;
};

export const useProjects = (session: any) =>
  useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*");
      if (error) throw error;
      return data!;
    },
    enabled: !!session,
  });

export const useTasks = (session: any) =>
  useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data!;
    },
    enabled: !!session,
});

export const useAddProject = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const { error } = await supabase.from("projects").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
        if (onSuccessCallback) {
            onSuccessCallback();
        }
    },
  });
}

export const useAddTask = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Task) => {
      const { error } = await supabase.from("tasks").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
  });
};

export const useUpdateTask = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          name: task.name,
          description: task.description,
          project_id: task.project_id,
        })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
  });
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};