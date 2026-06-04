export type UserRole = 'OWNER' | 'PROJECT_MANAGER' | 'EMPLOYEE' | 'FINANCE' | 'HR' | 'CLIENT';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'REVIEW';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  photoURL?: string;
  createdAt: string;
  lastLogin: string;
  clientId?: string;
  passwordChangeRequired?: boolean;
  token?: string;
  isOffline?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  clientId?: string; // Connected Client Entity ID
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  progress: number;
  priority: ProjectPriority;
  status: ProjectStatus;
  projectManagerId: string;
  teamMembers: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  industry?: string;
  createdAt: string;
  updatedAt: string;
  user_id?: string | number;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
  projects_count?: number;
  status?: string;
  is_approved?: boolean;
  user?: {
    id: number | string;
    name: string;
    email: string;
    password?: string;
    role: string;
    is_approved?: number | boolean;
    password_change_required?: number | boolean;
    created_at?: string;
    updated_at?: string;
  };
  projects?: Array<{
    id: number | string;
    client_id: number | string;
    name: string;
    description: string;
    status: string;
    progress_percentage?: number;
    budget?: number | string;
    start_date?: string;
    end_date?: string;
  }>;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface Acompte {
  id: string;
  clientId: string;
  projectId: string;
  projectName: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  issueDate: string;
  dueDate: string;
  description: string;
}

export interface FeedbackReply {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

export interface ProjectFeedback {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  type: 'COMMENT' | 'RECLAMATION';
  title?: string;
  content: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED';
  createdAt: string;
  replies?: FeedbackReply[];
}

export interface Lot {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  progress: number;
  budget?: number;
  startDate: string;
  endDate: string;
  assignedUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: string;
  author: string;
  ref: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  lotId?: string;
  name: string;
  description: string;
  assigneeId: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  dependencies: string[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
  parentTaskId?: string;
  parent_task_id?: string | number;
  subtasks?: Task[];
  budget?: number;
  assignedUsers?: string[];
}

export interface BudgetEntry {
  id: string;
  projectId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
  authorizedBy: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
  createdAt: string;
  link?: string;
}
