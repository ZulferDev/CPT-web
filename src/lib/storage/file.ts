import type { CptwFile } from '$lib/types';

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
  const exportData = { ...project, updatedAt: new Date().toISOString() };
  const json = JSON.stringify(exportData, null, 2);
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

    let cancelled = true;
    const timeout = setTimeout(() => {
      if (cancelled) reject(new Error('Import cancelled'));
    }, 300 * 1000);

    input.onchange = async () => {
      cancelled = false;
      clearTimeout(timeout);
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      try {
        const text = await file.text();
        const project = JSON.parse(text) as CptwFile;
        if (!project.version || !project.topology) {
          reject(new Error('Invalid .cptw file: missing version or topology'));
          return;
        }
        if (!project.createdAt) project.createdAt = new Date().toISOString();
        resolve(project);
      } catch (e) {
        reject(new Error('Failed to parse file: ' + (e instanceof Error ? e.message : 'unknown error')));
      }
    };

    window.addEventListener('focus', () => {
      setTimeout(() => {
        if (cancelled && !input.files?.length) {
          clearTimeout(timeout);
          reject(new Error('Import cancelled'));
        }
      }, 200);
    }, { once: true });

    input.click();
  });
}
