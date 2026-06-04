import { Client, Project, Lot, Task } from '../types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: "ONEE Branche Electricité",
    email: "client_onee@ecotransfo.ma",
    contactName: "M. Karim El Alami",
    contactEmail: "k.alami@onee.ma",
    phone: "+212 522 456 789",
    address: "65, Rue Othman Ben Affan, Casablanca",
    industry: "Énergie",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'c2',
    name: "TMSA",
    email: "client_tmsa@ecotransfo.ma",
    contactName: "Mme. Leila Bennani",
    contactEmail: "l.bennani@tmsa.ma",
    phone: "+212 539 934 000",
    address: "Zone Franche Logistique, Tanger Med",
    industry: "Logistique & Infrastructures",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: "Modernisation Poste HT/BT Marrakech",
    description: "Remplacement des transformateurs de puissance et mise en place d'un système de supervision SCADA.",
    client: "ONEE Branche Electricité",
    clientId: "c1",
    budget: 4500000,
    spent: 1250000,
    startDate: "2026-01-15",
    endDate: "2026-06-20",
    progress: 35,
    priority: "HIGH",
    status: "ACTIVE",
    projectManagerId: "demo-user",
    teamMembers: ["m1", "m2", "m3"],
    category: "Infrastructure",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p2',
    name: "Extension Réseau Distribution Tanger Med",
    description: "Installation de nouveaux postes de transformation pour la zone franche logistique.",
    client: "TMSA",
    clientId: "c2",
    budget: 12800000,
    spent: 0,
    startDate: "2026-04-01",
    endDate: "2026-11-30",
    progress: 5,
    priority: "CRITICAL",
    status: "PLANNING",
    projectManagerId: "demo-user",
    teamMembers: ["m1", "m4"],
    category: "Distribution",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_LOTS: Lot[] = [
  {
    id: 'l1',
    projectId: 'p1',
    name: "Génie Civil & Fondations",
    description: "Construction des dalles béton pour les nouveaux transformateurs.",
    status: "COMPLETED",
    progress: 100,
    budget: 450000,
    startDate: "2026-01-15",
    endDate: "2026-02-15",
    assignedUsers: ["Ahmed Mansouri"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'l2',
    projectId: 'p1',
    name: "Installation Transformateurs",
    description: "Pose et raccordement des 2 transformateurs 10MVA.",
    status: "ACTIVE",
    progress: 45,
    budget: 2500000,
    startDate: "2026-03-01",
    endDate: "2026-05-30",
    assignedUsers: ["Karim Benjelloun", "Youssef Alaoui"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    lotId: 'l2',
    name: "Réception site des transformateurs",
    description: "Vérification de l'état des équipements à la livraison.",
    assigneeId: "demo-user",
    startDate: "2026-03-01",
    endDate: "2026-03-03",
    status: "DONE",
    priority: "HIGH",
    progress: 100,
    estimatedHours: 8,
    actualHours: 10,
    dependencies: [],
    comments: [],
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 't2',
    projectId: 'p1',
    lotId: 'l2',
    name: "Câblage puissance BT",
    description: "Raccordement des sorties BT aux jeux de barres.",
    assigneeId: "m1",
    startDate: "2026-04-01",
    endDate: "2026-04-15",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    progress: 30,
    estimatedHours: 40,
    actualHours: 15,
    dependencies: ['t1'],
    comments: [],
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
