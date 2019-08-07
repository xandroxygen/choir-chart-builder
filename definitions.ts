export interface Section {
  title: SectionTitle;
  count: number;
}

export interface Singer {
  firstName: string;
  lastName: string;
  section: SectionTitle;
  height: number;
  seat: string;
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
