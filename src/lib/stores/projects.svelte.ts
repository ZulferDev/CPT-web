import Dexie from 'dexie';
import type { CptwFile } from '$lib/types';

interface ProjectRecord {
  id?: number;
  name: string;
  data: CptwFile;
  updatedAt: Date;
}

interface SettingsRecord {
  key: string;
  value: unknown;
}

class CptwDatabase extends Dexie {
  projects!: Dexie.Table<ProjectRecord, number>;
  settings!: Dexie.Table<SettingsRecord, string>;

  constructor() {
    super('cpt-web');
    this.version(1).stores({
      projects: '++id, name, updatedAt',
      settings: '&key',
    });
  }
}

const db = new CptwDatabase();

let projectList = $state<{ id: number; name: string; updatedAt: Date }[]>([]);

export function getProjectList() { return projectList; }

export async function loadProjectList() {
  projectList = await db.projects
    .orderBy('updatedAt')
    .reverse()
    .toArray();
}

export async function saveProject(id: number | undefined, name: string, data: CptwFile) {
  const now = new Date();
  if (id != null) {
    await db.projects.put({ id, name, data, updatedAt: now });
  } else {
    await db.projects.add({ name, data, updatedAt: now });
  }
  await loadProjectList();
}

export async function deleteProject(id: number) {
  await db.projects.delete(id);
  await loadProjectList();
}

export async function getProject(id: number): Promise<CptwFile | undefined> {
  const record = await db.projects.get(id);
  return record?.data;
}
