import type { CptwFile } from '$lib/types';

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
}

export function createNewProject(name: string): CptwFile {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    name,
    createdAt: now,
    updatedAt: now,
    metadata: {},
    topology: { devices: [], cables: [], notes: [] },
  };
}

export function exportToFile(project: CptwFile): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.cptw`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromFile(): Promise<CptwFile> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cptw,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      try {
        const text = await file.text();
        const project = JSON.parse(text) as CptwFile;
        if (!project.version || !project.topology) {
          reject(new Error('Invalid .cptw file'));
          return;
        }
        resolve(project);
      } catch (e) {
        reject(new Error('Failed to parse file'));
      }
    };
    input.click();
  });
}
