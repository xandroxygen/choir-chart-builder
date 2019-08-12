export interface Section {
  title: SectionTitle;
  count: number;
}

export interface Singer {
  firstName: string;
  lastName: string;
  section: SectionTitle;
  height: number;
  seat: {
    row: string;
    num: number;
  };
}

export interface Row {
  letter: string;
  seats: number;
}

export enum SectionTitle {
  T1 = "T1",
  T2 = "T2",
  B1 = "B1",
  B2 = "B2"
}

export interface IncorrectPair {
  forAdding: number;
  forSubtracting: number;
}

export interface SectionLayout {
  J?: number[];
  H?: number[];
  G?: number[];
  F?: number[];
  E?: number[];
  D?: number[];
  C?: number[];
  B?: number[];
}

export interface Config {
  availableRows: number;
  startingRow: string;
  sections: { title: string; color: string }[][];
}

export interface FailedUpdate {
  name: string;
  cell: {
    r: number;
    c: number;
  };
}
