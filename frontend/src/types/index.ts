// User types
export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles?: Role[];
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permissions?: Permission[];
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  group: string | null;
  description: string | null;
}

// Project types
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Team {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  creator?: User;
  members_count?: number;
  projects_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  team_role: 'lead' | 'member';
  joined_at: string;
  user?: User;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: TaskPriority;
  start_date: string | null;
  deadline: string | null;
  project_manager_id: number | null;
  team_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  manager?: User;
  team?: Team;
  creator?: User;
  members?: User[];
  members_count?: number;
  tasks_count?: number;
  progress?: number;
  is_overdue?: boolean;
  completion_submitted_at: string | null;
  completed_at: string | null;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  project_role: ProjectRole;
  joined_at: string;
  user?: User;
}

export type ProjectRole = 'manager' | 'member' | 'viewer';

// Task types
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: number | null;
  reporter_id: number;
  parent_task_id: number | null;
  deadline: string | null;
  position: number;
  version: number;
  created_at: string;
  updated_at: string;
  project?: Project;
  assignee?: User;
  reporter?: User;
  parent_task?: Task;
  subtasks?: Task[];
  labels?: Label[];
  comments?: Comment[];
  attachments?: Attachment[];
  dependencies?: Task[];
  approvals?: Approval[];
  is_overdue?: boolean;
  subtasks_count?: number;
  comments_count?: number;
  attachments_count?: number;
}

// Label types
export interface Label {
  id: number;
  name: string;
  color: string;
  project_id: number | null;
}

// Comment types
export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: Comment[];
}

// Attachment types
export interface Attachment {
  id: number;
  task_id: number;
  uploaded_by: number;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
  human_size?: string;
  created_at: string;
  uploader?: User;
}

// Approval types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_required';

export interface Approval {
  id: number;
  task_id: number;
  status: ApprovalStatus;
  requested_by: number;
  reviewed_by: number | null;
  comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  requester?: User;
  reviewer?: User;
  histories?: ApprovalHistory[];
}

export interface ApprovalHistory {
  id: number;
  approval_id: number;
  user_id: number;
  action: string;
  comment: string | null;
  created_at: string;
  user?: User;
}

export interface ProjectApproval {
  id: number;
  project_id: number;
  status: ApprovalStatus;
  requested_by: number;
  reviewed_by: number | null;
  comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  requester?: User;
  reviewer?: User;
  histories?: ProjectApprovalHistory[];
}

export interface ProjectApprovalHistory {
  id: number;
  project_approval_id: number;
  user_id: number;
  action: string;
  comment: string | null;
  created_at: string;
  user?: User;
}

/** Lightweight pending approval item for the cross-project review queue. */
export interface ApprovalQueueItem {
  id: number;
  status: ApprovalStatus;
  comment: string | null;
  created_at: string;
  requester?: User;
  task: Pick<Task, 'id' | 'project_id' | 'title' | 'status' | 'priority' | 'deadline' | 'version' | 'is_overdue'> & {
    project: Pick<Project, 'id' | 'name'> | null;
    assignee: User | null;
  };
}

// Audit Log types
export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: User;
}

// Notification types
export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
  path: string;
  links: PaginationLink[];
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

// Dashboard types
export interface UpcomingDeadline {
  id: number;
  title: string;
  priority: TaskPriority;
  deadline: string | null;
  status: TaskStatus;
  is_overdue: boolean;
  project_name?: string;
  assignee_name?: string;
}

export interface DashboardStats {
  role?: string;
  total_users?: number;
  total_projects?: number;
  active_projects?: number;
  completed_projects?: number;
  overdue_projects?: number;
  pending_project_approvals?: number | null;
  revision_requested_projects?: number;
  total_tasks?: number;
  in_progress_tasks?: number;
  done_tasks?: number;
  overdue_tasks?: number;
  completion_percentage?: number;
  assigned_projects?: number;
  assigned_tasks?: number;
  due_soon_tasks?: number;
  /** Null when the viewer cannot approve tasks. */
  pending_approvals?: number | null;
  tasks_by_status?: Record<TaskStatus, number>;
  upcoming_deadlines?: UpcomingDeadline[];
  team_workload?: TeamWorkload[];
  recent_activities?: AuditLog[];
  recent_messages?: DashboardRecentMessage[];
}

export interface DashboardRecentMessage {
  id: number;
  body: string | null;
  user_name?: string;
  conversation_id: number;
  conversation_type?: string;
  conversation_name?: string;
  created_at: string;
}

export interface TeamWorkload {
  user: User;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
}

// Filter types
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: number;
  project_id?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// Chat types
export type ConversationType = 'private' | 'team' | 'project';

export interface Conversation {
  id: number;
  type: ConversationType;
  name: string | null;
  team_id: number | null;
  project_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_message?: Message;
  participants?: User[];
  team?: Team;
  project?: Project;
  messages_count?: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  user_id: number;
  body: string | null;
  parent_id: number | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  parent?: Message;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  replies_count?: number;
}

export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
  user?: User;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  uploaded_by: number;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
  human_size: string;
  path: string;
  created_at: string;
  uploader?: User;
}
