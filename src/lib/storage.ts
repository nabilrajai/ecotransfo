import { Project, Lot, Task, UserProfile, BudgetEntry, AppNotification, ProjectDocument, ProjectMessage, Client, ActivityLog, Acompte, ProjectFeedback, FeedbackReply } from '../types';
import { syncToFirebase, deleteFromFirebase } from './firebase-sync';

const STORAGE_KEYS = {
  USER: 'ecotransfo_user',
  PROJECTS: 'ecotransfo_projects',
  LOTS: 'ecotransfo_lots',
  TASKS: 'ecotransfo_tasks',
  BUDGET: 'ecotransfo_budget',
  NOTIFICATIONS: 'ecotransfo_notifications',
  DOCUMENTS: 'ecotransfo_documents',
  MESSAGES: 'ecotransfo_messages',
  USERS: 'ecotransfo_users_list',
  CLIENTS: 'ecotransfo_clients_list',
  ACTIVITY_LOGS: 'ecotransfo_activity_logs_list',
  ACOMPTES: 'ecotransfo_acomptes_list',
  FEEDBACK: 'ecotransfo_project_feedback_list'
};

import { INITIAL_CLIENTS, INITIAL_PROJECTS, INITIAL_LOTS, INITIAL_TASKS } from './seed-data';

// Helper functions
const get = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const save = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const StorageService = {
  // Auth
  getUser: () => get<UserProfile | null>(STORAGE_KEYS.USER, null),
  setUser: (user: UserProfile | null) => save(STORAGE_KEYS.USER, user),
  getUsers: () => {
    return get<UserProfile[]>(STORAGE_KEYS.USERS, []);
  },
  saveUserProfile: async (user: UserProfile) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.uid === user.uid);
    if (index > -1) {
      users[index] = { ...user };
    } else {
      users.push({ ...user });
    }
    save(STORAGE_KEYS.USERS, users);
    await syncToFirebase('USERS', user.uid, user);
    
    // Log auth action
    await StorageService.addActivityLog(user.uid, "Mise à jour d'Utilisateur", `Profil mis à jour ou créé pour ${user.displayName}`);
    return users;
  },
  
  // Clients
  getClients: () => {
    return get<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  },
  saveClient: async (client: Client) => {
    const clients = StorageService.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    let actionStr = "Création du Client";
    let detailsStr = `Nouveau client créé: ${client.name}`;
    let savedClient = { ...client };
    if (index > -1) {
      clients[index] = { ...client, updatedAt: new Date().toISOString() };
      actionStr = "Mise à jour du Client";
      detailsStr = `Client mis à jour: ${client.name}`;
    } else {
      savedClient = { ...client, id: client.id || Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      clients.push(savedClient);
    }
    save(STORAGE_KEYS.CLIENTS, clients);
    await syncToFirebase('CLIENTS', savedClient.id, savedClient);
    
    // Log action
    const curUser = StorageService.getUser();
    if (curUser) {
      await StorageService.addActivityLog(curUser.uid, actionStr, detailsStr);
    }
    
    return savedClient;
  },
  deleteClient: async (id: string) => {
    const client = StorageService.getClients().find(c => c.id === id);
    const clients = StorageService.getClients().filter(c => c.id !== id);
    save(STORAGE_KEYS.CLIENTS, clients);
    await deleteFromFirebase('CLIENTS', id);
    
    // Log action
    const curUser = StorageService.getUser();
    if (curUser && client) {
      await StorageService.addActivityLog(curUser.uid, "Suppression du Client", `Client supprimé: ${client.name}`);
    }
    return clients;
  },

  // Activity Logs
  getActivityLogs: () => {
    return get<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
  },
  addActivityLog: async (userId: string, action: string, details: string) => {
    const logs = StorageService.getActivityLogs();
    const users = StorageService.getUsers();
    const user = users.find(u => u.uid === userId);
    
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      userName: user ? user.displayName : 'Utilisateur Inconnu',
      userRole: user ? user.role : 'Utilisateur',
      action,
      details,
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep last 300 logs
    if (logs.length > 300) logs.pop();
    save(STORAGE_KEYS.ACTIVITY_LOGS, logs);
    await syncToFirebase('ACTIVITY_LOGS', newLog.id, newLog);
  },

  // Acomptes
  getAcomptes: () => {
    return get<Acompte[]>(STORAGE_KEYS.ACOMPTES, []);
  },
  addAcompte: async (acompte: Omit<Acompte, 'id'>) => {
    const acomptes = StorageService.getAcomptes();
    const newAcompte: Acompte = {
      ...acompte,
      id: 'ac-' + Math.random().toString(36).substr(2, 9)
    };
    acomptes.unshift(newAcompte);
    save(STORAGE_KEYS.ACOMPTES, acomptes);
    await syncToFirebase('ACOMPTES', newAcompte.id, newAcompte);

    // Add income entry in budgets as well so finance is aligned
    await StorageService.addBudgetEntry({
      id: Math.random().toString(36).substr(2, 9),
      projectId: acompte.projectId,
      amount: acompte.amount,
      type: 'INCOME',
      category: 'Client Deposit (Acompte)',
      description: acompte.description || 'Appel de fonds client',
      date: acompte.issueDate,
      authorizedBy: 'Système'
    });

    const user = StorageService.getUser();
    if (user) {
      await StorageService.addActivityLog(user.uid, "Création d'Acompte", `Appel d'acompte créé de ${acompte.amount.toLocaleString()} MAD pour le projet ${acompte.projectName}`);
    }
    return newAcompte;
  },
  updateAcompteStatus: async (id: string, status: 'PENDING' | 'PAID' | 'CANCELLED') => {
    const acomptes = StorageService.getAcomptes();
    const idx = acomptes.findIndex(a => a.id === id);
    if (idx > -1) {
      acomptes[idx].status = status;
      save(STORAGE_KEYS.ACOMPTES, acomptes);
      await syncToFirebase('ACOMPTES', id, acomptes[idx]);
      
      const user = StorageService.getUser();
      if (user) {
        await StorageService.addActivityLog(user.uid, "Encaissement / Maj d'Acompte", `La facture d'acompte d'ID ${id} est passée au statut ${status}`);
      }
    }
    return acomptes;
  },

  // Project Feedback & Complaints
  getProjectFeedback: (projectId?: string) => {
    const fbList = get<ProjectFeedback[]>(STORAGE_KEYS.FEEDBACK, []);
    return projectId ? fbList.filter(f => f.projectId === projectId) : fbList;
  },
  saveProjectFeedback: async (feedback: ProjectFeedback) => {
    const fbList = get<ProjectFeedback[]>(STORAGE_KEYS.FEEDBACK, []);
    const index = fbList.findIndex(f => f.id === feedback.id);
    let isNew = false;
    if (index > -1) {
      fbList[index] = { ...feedback };
    } else {
      isNew = true;
      fbList.push({
        ...feedback,
        id: feedback.id || 'fb-' + Math.random().toString(36).substr(2, 9),
        createdAt: feedback.createdAt || new Date().toISOString(),
        replies: feedback.replies || []
      });
    }
    save(STORAGE_KEYS.FEEDBACK, fbList);
    await syncToFirebase('FEEDBACK', feedback.id || fbList[fbList.length - 1].id, index > -1 ? fbList[index] : fbList[fbList.length - 1]);

    // Activity log entry
    if (isNew) {
      await StorageService.addActivityLog(feedback.userId, feedback.type === 'RECLAMATION' ? "Dépôt de Réclamation" : "Ajout de Commentaire", `A déposé un(e) ${feedback.type.toLowerCase()} sur le projet.`);
    }
    return fbList;
  },
  addReplyToFeedback: async (feedbackId: string, reply: Omit<FeedbackReply, 'id' | 'createdAt'>) => {
    const fbList = get<ProjectFeedback[]>(STORAGE_KEYS.FEEDBACK, []);
    const index = fbList.findIndex(f => f.id === feedbackId);
    if (index > -1) {
      const fullReply: FeedbackReply = {
        ...reply,
        id: 'r-' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      const replies = fbList[index].replies || [];
      replies.push(fullReply);
      fbList[index].replies = replies;
      save(STORAGE_KEYS.FEEDBACK, fbList);
      await syncToFirebase('FEEDBACK', feedbackId, fbList[index]);
      
      await StorageService.addActivityLog(reply.userId, "Réponse Feedback", `A répondu au commentaire/reclamation d'ID ${feedbackId}`);
    }
    return fbList;
  },
  updateFeedbackStatus: async (feedbackId: string, status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED') => {
    const fbList = get<ProjectFeedback[]>(STORAGE_KEYS.FEEDBACK, []);
    const index = fbList.findIndex(f => f.id === feedbackId);
    if (index > -1) {
      fbList[index].status = status;
      save(STORAGE_KEYS.FEEDBACK, fbList);
      await syncToFirebase('FEEDBACK', feedbackId, fbList[index]);
      
      const user = StorageService.getUser();
      if (user) {
        await StorageService.addActivityLog(user.uid, "Statut Réclamation Maj", `Réclamation ID ${feedbackId} changée en ${status}`);
      }
    }
    return fbList;
  },

  // Projects
  getProjects: () => get<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS),
  saveProject: async (project: Project) => {
    const projects = StorageService.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    let savedProj = { ...project };
    if (index > -1) {
      projects[index] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      savedProj = { 
        ...project, 
        id: project.id || Math.random().toString(36).substr(2, 9), 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
      projects.push(savedProj);
    }
    save(STORAGE_KEYS.PROJECTS, projects);
    await syncToFirebase('PROJECTS', savedProj.id, savedProj);

    const user = StorageService.getUser();
    if (user) {
      await StorageService.addActivityLog(user.uid, index > -1 ? "Mise à jour de Projet" : "Création de Projet", `Projet '${project.name}' enregistré par ${user.displayName}`);
    }
    return projects;
  },
  deleteProject: async (id: string) => {
    const project = StorageService.getProjects().find(p => p.id === id);
    const projects = StorageService.getProjects().filter(p => p.id !== id);
    save(STORAGE_KEYS.PROJECTS, projects);
    await deleteFromFirebase('PROJECTS', id);

    const user = StorageService.getUser();
    if (user && project) {
      await StorageService.addActivityLog(user.uid, "Suppression de Projet", `Le projet '${project.name}' a été supprimé`);
    }
    return projects;
  },

  // Lots
  getLots: (projectId?: string) => {
    const lots = get<Lot[]>(STORAGE_KEYS.LOTS, []);
    return projectId ? lots.filter(l => l.projectId === projectId) : lots;
  },
  saveLot: async (lot: Lot) => {
    const lots = get<Lot[]>(STORAGE_KEYS.LOTS, INITIAL_LOTS);
    const index = lots.findIndex(l => l.id === lot.id);
    let savedLot = { ...lot };
    if (index > -1) {
      savedLot = { ...lot, updatedAt: new Date().toISOString() };
      lots[index] = savedLot;
    } else {
      savedLot = { ...lot, id: lot.id || Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      lots.push(savedLot);
    }
    save(STORAGE_KEYS.LOTS, lots);
    await syncToFirebase('LOTS', savedLot.id, savedLot);

    const user = StorageService.getUser();
    if (user) {
      await StorageService.addActivityLog(user.uid, index > -1 ? "Modification de Lot" : "Ajout de Lot", `Lot '${lot.name}' enregistré.`);
    }
    return lots;
  },
  deleteLot: async (id: string) => {
    const lots = get<Lot[]>(STORAGE_KEYS.LOTS, INITIAL_LOTS).filter(l => l.id !== id);
    save(STORAGE_KEYS.LOTS, lots);
    await deleteFromFirebase('LOTS', id);

    const user = StorageService.getUser();
    if (user) {
      await StorageService.addActivityLog(user.uid, "Suppression de Lot", `Le lot technique d'ID ${id} a été retiré.`);
    }
    return lots;
  },

  // Tasks
  getTasks: (projectId?: string, lotId?: string) => {
    const tasks = get<Task[]>(STORAGE_KEYS.TASKS, []);
    let filtered = tasks;
    if (projectId) filtered = filtered.filter(t => t.projectId === projectId);
    if (lotId) filtered = filtered.filter(t => t.lotId === lotId);
    return filtered;
  },
  saveTask: async (task: Task) => {
    const tasks = get<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const index = tasks.findIndex(t => t.id === task.id);
    let savedTask = { ...task };
    if (index > -1) {
      savedTask = { ...task, updatedAt: new Date().toISOString() };
      tasks[index] = savedTask;
    } else {
      savedTask = { ...task, id: task.id || Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      tasks.push(savedTask);
    }
    save(STORAGE_KEYS.TASKS, tasks);
    await syncToFirebase('TASKS', savedTask.id, savedTask);

    const user = StorageService.getUser();
    if (user) {
      await StorageService.addActivityLog(user.uid, index > -1 ? "Mise à jour de Tâche" : "Création de Tâche", `Tâche '${task.name}' affectée/enregistrée.`);
    }
    return tasks;
  },
  updateTask: async (id: string, updates: Partial<Task>) => {
    const tasks = get<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const index = tasks.findIndex(t => t.id === id);
    if (index > -1) {
      tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
      save(STORAGE_KEYS.TASKS, tasks);
      await syncToFirebase('TASKS', id, tasks[index]);

      const user = StorageService.getUser();
      if (user) {
        await StorageService.addActivityLog(user.uid, "Mise à jour de Tâche", `Statut ou progrès de la tâche '${tasks[index].name}' mis à jour.`);
      }
    }
    return tasks;
  },
  deleteTask: async (id: string) => {
    const tasks = get<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS).filter(t => t.id !== id);
    save(STORAGE_KEYS.TASKS, tasks);
    await deleteFromFirebase('TASKS', id);

    const user = StorageService.getUser();
    if (user) {
      await StorageService.addActivityLog(user.uid, "Suppression de Tâche", `La tâche d'ID ${id} a été supprimée.`);
    }
    return tasks;
  },

  // Notifications
  getNotifications: () => get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []),
  addNotification: async (notif: Partial<AppNotification>) => {
    const notifs = StorageService.getNotifications();
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      userId: StorageService.getUser()?.uid || '',
      title: notif.title || '',
      message: notif.message || '',
      type: notif.type || 'INFO',
      read: false,
      createdAt: new Date().toISOString(),
      ...(notif as any)
    };
    notifs.unshift(newNotif);
    save(STORAGE_KEYS.NOTIFICATIONS, notifs);
    await syncToFirebase('NOTIFICATIONS', newNotif.id, newNotif);
  },

  // Budget
  getBudget: (projectId: string) => {
    const entries = get<BudgetEntry[]>(STORAGE_KEYS.BUDGET, []);
    return entries.filter(e => e.projectId === projectId);
  },
  addBudgetEntry: async (entry: BudgetEntry) => {
    const entries = get<BudgetEntry[]>(STORAGE_KEYS.BUDGET, []);
    const newEntry = { ...entry, id: entry.id || Math.random().toString(36).substr(2, 9) };
    entries.push(newEntry);
    save(STORAGE_KEYS.BUDGET, entries);
    await syncToFirebase('BUDGET', newEntry.id, newEntry);
  },

  // Documents
  getDocuments: (projectId: string) => {
    const docs = get<ProjectDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    return docs.filter(d => d.projectId === projectId);
  },
  saveDocument: async (doc: ProjectDocument) => {
    const docs = get<ProjectDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    const newDoc = { ...doc, id: doc.id || Math.random().toString(36).substr(2, 9), createdAt: doc.createdAt || new Date().toISOString() };
    docs.push(newDoc);
    save(STORAGE_KEYS.DOCUMENTS, docs);
    await syncToFirebase('DOCUMENTS', newDoc.id, newDoc);
    return docs;
  },
  deleteDocument: async (id: string) => {
    const docs = get<ProjectDocument[]>(STORAGE_KEYS.DOCUMENTS, []).filter(d => d.id !== id);
    save(STORAGE_KEYS.DOCUMENTS, docs);
    await deleteFromFirebase('DOCUMENTS', id);
    return docs;
  },

  // Messages
  getMessages: (projectId: string) => {
    const msgs = get<ProjectMessage[]>(STORAGE_KEYS.MESSAGES, []);
    return msgs.filter(m => m.projectId === projectId);
  },
  saveMessage: async (msg: ProjectMessage) => {
    const msgs = get<ProjectMessage[]>(STORAGE_KEYS.MESSAGES, []);
    const newMsg = { ...msg, id: msg.id || Math.random().toString(36).substr(2, 9), createdAt: msg.createdAt || new Date().toISOString() };
    msgs.push(newMsg);
    save(STORAGE_KEYS.MESSAGES, msgs);
    await syncToFirebase('MESSAGES', newMsg.id, newMsg);
    return msgs;
  }
};
