import { jsPDF } from 'jspdf';
import { Project, Task } from '../types';
import { formatCurrency, formatDate } from './utils';

export function generateProjectReportPDF(projects: Project[], tasks: Task[], userDisplayName: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Brand color palette (Slate 900, Corporate Blue 600)
  const primaryColor = [15, 23, 42]; // #0f172a
  const accentColor = [37, 99, 235]; // #2563eb
  const textColor = [51, 65, 85]; // #334155
  const lightBg = [248, 250, 252]; // #f8fafc
  const grayBorder = [226, 232, 240]; // #e2e8f0

  // 1. Corporate Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 42, 'F');

  // Text inside header banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ECO TRANSFO EPPM', 20, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('REPORTING INDUSTRIEL, COMPTES CLIENTS & SUIVI FINANCIER', 20, 25);
  
  // Generation timestamp & operator
  doc.setFontSize(8);
  doc.setTextColor(191, 219, 254);
  const localDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Rapport extrait le ${localDate} par l'opérateur: ${userDisplayName}`, 20, 33);

  // Blue accent border under banner
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 42, 210, 2.5, 'F');

  // 2. Section: KPIs Indicators
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('I. INDICATEURS DE SYNTHÈSE DU PORTFOLIO', 20, 60);

  doc.setDrawColor(grayBorder[0], grayBorder[1], grayBorder[2]);
  doc.line(20, 63, 190, 63);

  // Render metric boxes (Grid format)
  const kpis = [
    { label: 'Projets total en cours', value: `${totalProjects}` },
    { label: 'Projets au statut "Actif"', value: `${activeProjects}` },
    { label: 'Taux d\'achèvement tâches', value: `${taskCompletionRate.toFixed(1)}%` },
    { label: 'Budget global alloué', value: `${formatCurrency(totalBudget)}` },
    { label: 'Dépenses totales constatées', value: `${formatCurrency(totalSpent)}` },
    { label: 'Taux consommation budget', value: `${budgetUtilization.toFixed(1)}%` }
  ];

  let kpiY = 70;
  doc.setFontSize(8);
  kpis.forEach((kpi, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const xPos = col === 0 ? 20 : 110;
    const yPos = kpiY + (row * 18);

    // Box outline
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(xPos, yPos, 80, 14, 'F');
    doc.setDrawColor(grayBorder[0], grayBorder[1], grayBorder[2]);
    doc.rect(xPos, yPos, 80, 14, 'S');

    // Label Text
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(kpi.label.toUpperCase(), xPos + 4, yPos + 5.5);

    // Value Text
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(kpi.value, xPos + 4, yPos + 10.5);
  });

  // 3. Section: Status of Projects Table
  let tableY = kpiY + (3 * 18) + 12;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('II. REVUE DÉTAILLÉE DES PROJETS ET DES FINANCES', 20, tableY);

  doc.setDrawColor(grayBorder[0], grayBorder[1], grayBorder[2]);
  doc.line(20, tableY + 3, 190, tableY + 3);

  tableY = tableY + 10;

  // Table header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, tableY, 170, 8.5, 'F');

  // Header texts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('INTITULÉ DU PROJET', 24, tableY + 5.5);
  doc.text("MAÎTRE D'OUVRAGE", 85, tableY + 5.5);
  doc.text('ENVELOPPE BUDGET', 135, tableY + 5.5);
  doc.text('AVANCEMENT', 168, tableY + 5.5);

  tableY = tableY + 8.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (projects.length === 0) {
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(20, tableY, 170, 12, 'F');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'italic');
    doc.text('Aucun projet en cours d\'exécution dans ce répertoire spécifique.', 24, tableY + 7);
  } else {
    projects.forEach((proj, idx) => {
      // Row tint
      if (idx % 2 === 0) {
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(20, tableY, 170, 11, 'F');

      // Bottom cell border
      doc.setDrawColor(grayBorder[0], grayBorder[1], grayBorder[2]);
      doc.line(20, tableY + 11, 190, tableY + 11);

      // Value outputs
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      let pName = proj.name || 'Projet Sans Nom';
      if (pName.length > 32) pName = pName.substring(0, 30) + '...';
      doc.text(pName, 24, tableY + 7);

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(proj.client || 'Non renseigné', 85, tableY + 7);

      doc.text(`${formatCurrency(proj.budget || 0)}`, 135, tableY + 7);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`${proj.progress}%`, 168, tableY + 7);

      tableY = tableY + 11;
    });
  }

  // 4. Footer disclaimer on bottom base of the A4 page
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text('Eco Transfo EPPM - Fiche confidentielle éditée de manière automatique via notre portail applicatif.', 20, 287);
  doc.text('Document officiel - Page 1 / 1', 160, 287);

  doc.save(`Rapport_Synthese_EcoTransfo_${new Date().toISOString().slice(0, 10)}.pdf`);
}
