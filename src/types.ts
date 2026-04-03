export interface Member {
  id: string;
  name: string;
  region: string;
  seniority: number;
}

export interface Group {
  id: number;
  members: Member[];
}

export type AppStatus = 'idle' | 'importing' | 'processing' | 'result';
