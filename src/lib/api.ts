import { StorageService } from './storage';

const API_BASE_URL = 'https://digiappseparator.com/Backend3/api';

const isOfflineMode = () => {
  const user = StorageService.getUser();
  return user?.isOffline === true;
};

// Simulated API responding instantly from Local Storage / StorageService
const simulateApi = async (method: string, path: string, body?: any): Promise<any> => {
  const cleanPath = path.replace(/^\/|\/$/g, '');
  const pathParts = cleanPath.split('/');
  const baseResource = pathParts[0]; // e.g. 'projects', 'tasks', 'clients', 'dashboard'
  const idParam = pathParts[1];      // e.g. 'p1'

  // Minor network delay simulation
  await new Promise(resolve => setTimeout(resolve, 200));

  if (baseResource === 'login') {
    const email = body?.email || 'demo@ecotransfo.ma';
    const isClient = email.toLowerCase().includes('client') || email.toLowerCase().includes('onee');
    const role = isClient ? 'CLIENT' : 'OWNER';
    return {
      token: 'simulated_offline_token_jwt',
      user: {
        id: 'demo-user-id',
        name: email.split('@')[0],
        email: email,
        role: role,
        created_at: new Date().toISOString()
      },
      must_change_password: false
    };
  }

  if (baseResource === 'register') {
    return { message: "Inscription réussie sur le stockage de démonstration locale." };
  }

  if (baseResource === 'forgot-password') {
    return { message: "Réinitialisation par e-mail simulée." };
  }

  if (baseResource === 'update-password-first-login') {
    return { message: "Mot de passe mis à jour." };
  }

  if (baseResource === 'dashboard') {
    const projects = StorageService.getProjects();
    const tasks = StorageService.getTasks();
    const feed = StorageService.getProjectFeedback();
    const notifs = StorageService.getNotifications();
    const logs = StorageService.getActivityLogs();

    return {
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING').length,
        completed: projects.filter(p => p.status === 'COMPLETED').length,
        avg_progress: projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) : 0,
        total_budget: projects.reduce((acc, p) => acc + (p.budget || 0), 0)
      },
      tasks: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
        overdue: tasks.filter(t => t.status !== 'DONE' && new Date(t.endDate) < new Date()).length,
        done: tasks.filter(t => t.status === 'DONE').length
      },
      reclamations: {
        total: feed.filter(f => f.type === 'RECLAMATION').length,
        open: feed.filter(f => f.type === 'RECLAMATION' && f.status !== 'RESOLVED').length,
        critical: feed.filter(f => f.type === 'RECLAMATION' && f.status === 'PENDING')
      },
      notifications: {
        unread_count: notifs.filter(n => !n.read).length
      },
      recent_activity: logs.map(l => ({
        id: l.id,
        user_name: l.userName,
        user_role: l.userRole,
        action: l.action,
        details: l.details,
        created_at: l.createdAt
      }))
    };
  }

  if (baseResource === 'projects') {
    if (idParam === 'global' && pathParts[2] === 'stats') {
      const projects = StorageService.getProjects();
      const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
      const totalSpent = projects.reduce((acc, p) => acc + (p.spent || 0), 0);
      return {
        total_projects: projects.length,
        active_projects: projects.filter(p => p.status === 'ACTIVE').length,
        completed_projects: projects.filter(p => p.status === 'COMPLETED').length,
        total_budget: totalBudget,
        total_spent: totalSpent,
        projects_on_hold: projects.filter(p => p.status === 'ON_HOLD').length
      };
    }

    if (idParam && pathParts[2] === 'lots') {
      return StorageService.getLots(idParam);
    }

    if (idParam) {
      if (pathParts[2] === 'assign-manager') {
        if (method === 'POST') {
          const projects = StorageService.getProjects();
          const idx = projects.findIndex(p => String(p.id) === idParam);
          if (idx > -1) {
            const original = projects[idx];
            const updated = {
              ...original,
              projectManagerId: body.manager_id ? String(body.manager_id) : original.projectManagerId,
              updatedAt: new Date().toISOString()
            };
            await StorageService.saveProject(updated);
            return { success: true, message: 'Manager assigned successfully' };
          }
          throw new Error("Projet non trouvé.");
        }
      }

      if (method === 'GET') {
        const p = StorageService.getProjects().find(proj => String(proj.id) === idParam);
        if (!p) throw new Error("Projet non trouvé.");
        const proj = {
          ...p,
          lots: StorageService.getLots(p.id).map(l => ({
            ...l,
            tasks: StorageService.getTasks(p.id, l.id)
          })),
          feedback: StorageService.getProjectFeedback(p.id),
          acomptes: StorageService.getAcomptes().filter(a => a.projectId === p.id),
          documents: StorageService.getDocuments(p.id),
          messages: StorageService.getMessages(p.id)
        } as any;
        const managerObj = StorageService.getUsers().find(u => u.uid === proj.projectManagerId);
        const clientObj = StorageService.getClients().find(c => String(c.id) === String(proj.clientId)) || StorageService.getUsers().find(u => u.uid === proj.clientId);

        const allUsersList = StorageService.getUsers();
        const allTasksList = StorageService.getTasks();
        
        const resourceMembers: any[] = [];
        const uniqueUids = new Set<string>();

        if (proj.projectManagerId) {
          uniqueUids.add(String(proj.projectManagerId));
        }
        if (proj.manager_id) {
          uniqueUids.add(String(proj.manager_id));
        }

        const teamMemberIds = proj.teamMembers || proj.team_members || [];
        teamMemberIds.forEach((tmId: any) => uniqueUids.add(String(tmId)));

        uniqueUids.forEach(uid => {
          const uProfile = allUsersList.find(u => String(u.uid) === uid);
          if (uProfile) {
            const isManager = uid === String(proj.projectManagerId) || uid === String(proj.manager_id);
            const userIncompleteTasks = allTasksList.filter(t => String(t.projectId) === String(proj.id) && String(t.assigneeId) === uid && t.status !== 'DONE');
            const calculatedLoad = isManager ? 80 : Math.min(100, 30 + userIncompleteTasks.length * 20);
            const statusVal = calculatedLoad > 90 ? 'Surcharge' : calculatedLoad <= 30 ? 'Congés' : 'Optimal';
            const initials = uProfile.displayName ? uProfile.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'EP';
            
            resourceMembers.push({
              id: uProfile.uid,
              name: uProfile.displayName || uProfile.email || 'Anonyme',
              role: isManager ? 'Chef de Projet' : (uProfile.department || 'Expert Technique'),
              load: calculatedLoad,
              avatar: initials || 'R',
              status: statusVal,
              email: uProfile.email,
              phone: '+212 522 ' + Math.floor(100000 + Math.random() * 900000)
            });
          }
        });

        return {
          project: {
            ...proj,
            manager: managerObj || null,
            client: clientObj || proj.client || null,
            resources: resourceMembers,
            created_at: proj.createdAt,
            updated_at: proj.updatedAt
          },
          kpis: {
            task_counts: {
              total: 0,
              todo: 0,
              in_progress: 0,
              done: 0
            },
            financials: {
              budget: proj.budget,
              resource_cost: 0
            },
            completion_rate: 0
          }
        };
      }
      if (method === 'PUT') {
        const projects = StorageService.getProjects();
        const idx = projects.findIndex(p => String(p.id) === idParam);
        if (idx > -1) {
          const original = projects[idx];
          const updated = {
            ...original,
            name: body.name !== undefined ? body.name : original.name,
            description: body.description !== undefined ? body.description : original.description,
            status: body.status !== undefined ? body.status : original.status,
            progress: body.progress !== undefined ? Number(body.progress) : original.progress,
            budget: body.budget !== undefined ? Number(body.budget) : original.budget,
            priority: body.priority !== undefined ? body.priority : original.priority,
            startDate: body.start_date !== undefined ? body.start_date : (body.startDate !== undefined ? body.startDate : original.startDate),
            endDate: body.end_date !== undefined ? body.end_date : (body.endDate !== undefined ? body.endDate : original.endDate),
            projectManagerId: body.manager_id !== undefined ? String(body.manager_id) : (body.projectManagerId !== undefined ? String(body.projectManagerId) : original.projectManagerId),
            teamMembers: body.team_members !== undefined ? body.team_members : (body.teamMembers !== undefined ? body.teamMembers : original.teamMembers),
            updatedAt: new Date().toISOString()
          };
          await StorageService.saveProject(updated);
          return updated;
        }
        throw new Error("Projet non trouvé.");
      }
      if (method === 'DELETE') {
        await StorageService.deleteProject(idParam);
        return { success: true };
      }
    }

    if (method === 'GET') {
      return StorageService.getProjects();
    }

    if (method === 'POST') {
      const newProj = {
        id: 'p-' + Math.random().toString(36).substr(2, 9),
        name: body.name || 'Nouveau Projet',
        description: body.description || '',
        client: body.client || 'Client Démo',
        clientId: body.client_id || 'c1',
        budget: Number(body.budget) || 0,
        spent: 0,
        startDate: body.start_date || new Date().toISOString().split('T')[0],
        endDate: body.end_date || new Date().toISOString().split('T')[0],
        progress: 0,
        priority: body.priority || 'MEDIUM',
        status: 'PLANNING',
        projectManagerId: StorageService.getUser()?.uid || 'demo-user-id',
        teamMembers: body.team_members || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await StorageService.saveProject(newProj as any);
      return newProj;
    }
  }

  if (baseResource === 'lots') {
    if (idParam) {
      if (method === 'PUT') {
        const lots = StorageService.getLots();
        const idx = lots.findIndex(l => String(l.id) === idParam);
        if (idx > -1) {
          const updated = {
            ...lots[idx],
            ...body,
            id: idParam,
            updatedAt: new Date().toISOString()
          };
          await StorageService.saveLot(updated);
          return updated;
        }
      }
    }
    if (method === 'GET') {
      return StorageService.getLots();
    }
    if (method === 'POST') {
      const newLot = {
        id: 'l-' + Math.random().toString(36).substr(2, 9),
        projectId: body.project_id || body.projectId || '',
        name: body.name || '',
        description: body.description || '',
        status: body.status || 'PLANNING',
        progress: 0,
        budget: Number(body.budget) || 0,
        startDate: body.start_date || new Date().toISOString().split('T')[0],
        endDate: body.end_date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await StorageService.saveLot(newLot as any);
      return newLot;
    }
  }

  if (baseResource === 'tasks') {
    if (idParam) {
      if (method === 'PUT') {
        const tasks = StorageService.getTasks();
        const idx = tasks.findIndex(t => String(t.id) === idParam);
        if (idx > -1) {
          const original = tasks[idx];
          const updated = {
            ...original,
            name: body.name !== undefined ? body.name : original.name,
            description: body.description !== undefined ? body.description : original.description,
            status: body.status !== undefined ? body.status : original.status,
            progress: body.progress !== undefined ? Number(body.progress) : original.progress,
            startDate: body.start_date !== undefined ? body.start_date : original.startDate,
            endDate: body.end_date !== undefined ? body.end_date : original.endDate,
            priority: body.priority !== undefined ? body.priority : original.priority,
            assigneeId: body.assigned_to_user_id !== undefined ? body.assigned_to_user_id : original.assigneeId,
            comments: body.comments !== undefined ? body.comments : original.comments,
            attachments: body.attachments !== undefined ? body.attachments : original.attachments,
            parentTaskId: body.parent_task_id !== undefined ? (body.parent_task_id ? String(body.parent_task_id) : undefined) : (body.parentTaskId !== undefined ? body.parentTaskId : original.parentTaskId),
            parent_task_id: body.parent_task_id !== undefined ? body.parent_task_id : (body.parentTaskId !== undefined ? body.parentTaskId : original.parent_task_id),
            updatedAt: new Date().toISOString()
          };
          await StorageService.saveTask(updated);
          return updated;
        }
        throw new Error("Tâche non trouvée.");
      }
      if (method === 'DELETE') {
        await StorageService.deleteTask(idParam);
        return { success: true };
      }
    }

    if (method === 'GET') {
      return StorageService.getTasks();
    }

    if (method === 'POST') {
      const newTask = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        projectId: body.project_id || '',
        lotId: body.lot_id || body.lotId || '',
        name: body.name || 'Nouvelle Tâche',
        description: body.description || '',
        assigneeId: body.assigned_to_user_id || StorageService.getUser()?.uid || '',
        startDate: body.start_date || new Date().toISOString().split('T')[0],
        endDate: body.end_date || new Date().toISOString().split('T')[0],
        status: body.status || 'TODO',
        priority: body.priority || 'MEDIUM',
        progress: body.progress !== undefined ? Number(body.progress) : 0,
        estimatedHours: Number(body.estimated_hours || body.estimatedHours) || 0,
        actualHours: 0,
        dependencies: body.dependencies || [],
        comments: body.comments || [],
        attachments: body.attachments || [],
        parentTaskId: body.parent_task_id ? String(body.parent_task_id) : (body.parentTaskId || undefined),
        parent_task_id: body.parent_task_id || body.parentTaskId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await StorageService.saveTask(newTask);
      return newTask;
    }
  }

  if (baseResource === 'clients') {
    if (method === 'GET') {
      return StorageService.getClients();
    }
    if (method === 'POST') {
      if (idParam) {
        // Update client
        const clients = StorageService.getClients();
        const existingIdx = clients.findIndex(c => String(c.id) === idParam);
        if (existingIdx > -1) {
          const updated = {
            ...clients[existingIdx],
            ...body,
            name: body.name || body.company_name || clients[existingIdx].name,
            company_name: body.company_name || body.name || clients[existingIdx].company_name || clients[existingIdx].name,
            email: body.email !== undefined ? body.email : clients[existingIdx].email,
            contactName: body.contactName !== undefined ? body.contactName : (body.contact_name !== undefined ? body.contact_name : clients[existingIdx].contactName),
            contactEmail: body.contactEmail !== undefined ? body.contactEmail : (body.contact_email !== undefined ? body.contact_email : clients[existingIdx].contactEmail),
            phone: body.phone !== undefined ? body.phone : clients[existingIdx].phone,
            address: body.address !== undefined ? body.address : clients[existingIdx].address,
            industry: body.industry !== undefined ? body.industry : clients[existingIdx].industry,
            status: body.status !== undefined ? body.status : clients[existingIdx].status,
            is_approved: body.is_approved !== undefined ? body.is_approved : clients[existingIdx].is_approved,
            updatedAt: new Date().toISOString()
          };
          await StorageService.saveClient(updated);
          return updated;
        }
      }
      const newClient = {
        id: 'c-' + Math.random().toString(36).substr(2, 9),
        name: body.name || body.company_name || 'Nouveau Client',
        company_name: body.company_name || body.name || 'Nouveau Client',
        email: body.email || '',
        contactName: body.contact_name || body.contactName || '',
        contactEmail: body.contact_email || body.contactEmail || '',
        phone: body.phone || '',
        address: body.address || '',
        industry: body.industry || '',
        status: body.status || 'PENDING',
        is_approved: body.is_approved !== undefined ? body.is_approved : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await StorageService.saveClient(newClient);
      return newClient;
    }
    if (method === 'DELETE' && idParam) {
      await StorageService.deleteClient(idParam);
      return { success: true };
    }
  }

  if (baseResource === 'users') {
    if (method === 'GET') {
      return StorageService.getUsers();
    }
  }

  return {};
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const user = StorageService.getUser();
  if (user && user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }
  console.log("Token in headers:", user?.token ? "present" : "missing");
  return headers;
};

const convertInProgressToActive = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertInProgressToActive);
  }

  const result: any = {};
  for (const key of Object.keys(obj)) {
    result[key] = convertInProgressToActive(obj[key]);
  }

  // Map database properties (snake_case) to UI expected properties (camelCase)
  if ('start_date' in result && !('startDate' in result)) {
    result.startDate = result.start_date;
  }
  if ('end_date' in result && !('endDate' in result)) {
    result.endDate = result.end_date;
  }
  if ('progress_percentage' in result && !('progress' in result)) {
    result.progress = Number(result.progress_percentage || 0);
  }
  if ('client_id' in result && !('clientId' in result)) {
    result.clientId = String(result.client_id);
  }
  if ('manager_id' in result && !('projectManagerId' in result)) {
    result.projectManagerId = String(result.manager_id);
  }

  // Ensure database keys also exist if camelCase keys were present
  if ('startDate' in result && !('start_date' in result)) {
    result.start_date = result.startDate;
  }
  if ('endDate' in result && !('end_date' in result)) {
    result.end_date = result.endDate;
  }
  if ('progress' in result && !('progress_percentage' in result)) {
    result.progress_percentage = Number(result.progress || 0);
  }
  if ('clientId' in result && !('client_id' in result)) {
    result.client_id = result.clientId;
  }
  if ('projectManagerId' in result && !('manager_id' in result)) {
    result.manager_id = result.projectManagerId;
  }

  if (result.status === 'IN_PROGRESS') {
    const isTask = 'assigneeId' in result || 'estimatedHours' in result || 'actualHours' in result || 'lotId' in result;
    if (!isTask) {
      result.status = 'ACTIVE';
    }
  }

  return result;
};

const convertActiveToInProgress = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertActiveToInProgress);
  }

  const result: any = {};
  for (const key of Object.keys(obj)) {
    result[key] = convertActiveToInProgress(obj[key]);
  }

  if (result.status === 'ACTIVE') {
    const isTask = 'assigneeId' in result || 'estimatedHours' in result || 'actualHours' in result || 'lotId' in result;
    if (!isTask) {
      result.status = 'IN_PROGRESS';
    }
  } else if (result.status === 'CANCELLED') {
    const isTask = 'assigneeId' in result || 'estimatedHours' in result || 'actualHours' in result || 'lotId' in result;
    if (!isTask) {
      result.status = 'ON_HOLD';
    }
  }

  // Write camelCase keys back to database keys for API compatibility
  if (result.startDate !== undefined) {
    result.start_date = result.startDate;
  }
  if (result.endDate !== undefined) {
    result.end_date = result.endDate;
  }
  if (result.progress !== undefined) {
    result.progress_percentage = Number(result.progress || 0);
  }
  if (result.clientId !== undefined) {
    result.client_id = result.clientId;
  }
  if (result.projectManagerId !== undefined) {
    result.manager_id = result.projectManagerId;
  }

  return result;
};

const handleResponse = async (response: Response, path: string) => {
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    StorageService.setUser(null);
    window.location.href = '/login';
    throw new Error('Non autorisé. Veuillez vous reconnecter.');
  }
  if (!response.ok) {
    throw new Error(data.message || 'Une erreur est survenue.');
  }
  return convertInProgressToActive(data);
};

export const api = {
  async get(path: string, params: Record<string, any> = {}) {
    if (isOfflineMode()) {
      return simulateApi('GET', path);
    }
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      return await handleResponse(response, path);
    } catch (err) {
      console.warn('Network or server error, falling back locally:', err);
      return simulateApi('GET', path);
    }
  },
  async post(path: string, body: any) {
    if (isOfflineMode()) {
      return simulateApi('POST', path, body);
    }
    
    const mappedBody = convertActiveToInProgress(body);
    
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(mappedBody),
      });
      return await handleResponse(response, path);
    } catch (err) {
      console.warn('Network or server error, falling back locally:', err);
      return simulateApi('POST', path, body);
    }
  },
  async put(path: string, body: any) {
    if (isOfflineMode()) {
      return simulateApi('PUT', path, body);
    }
    
    const mappedBody = convertActiveToInProgress(body);
    
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(mappedBody),
      });
      return await handleResponse(response, path);
    } catch (err) {
      console.warn('Network or server error, falling back locally:', err);
      return simulateApi('PUT', path, body);
    }
  },
  async delete(path: string) {
    if (isOfflineMode()) {
      return simulateApi('DELETE', path);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await handleResponse(response, path);
    } catch (err) {
      console.warn('Network or server error, falling back locally:', err);
      return simulateApi('DELETE', path);
    }
  }
};
