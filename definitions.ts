export interface Choir {
    sections: [Section]
}

export interface Section {
    singers: [Singer],
    title: SectionTitle
}

export interface Singer {
    firstName: string,
    lastName: string,
    height: number,
    seat?: Seat
}

export interface Seat {
    row: string,
    num: number
}

export interface Row {
    letter: string,
    seats: number
}

export enum SectionTitle {
    T1 = "T1", 
    T2 = "T2", 
    B1 = "B1",
    B2 = "B2"
}

export interface SectionNumbers
{
    title: SectionTitle,
    count: number
}

