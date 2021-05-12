export interface nonBaselineResult {
    PIDName: string,
    numOfPoints: number, 
    mean: number, 
    std: number, 
    startPointIndex: number, 
    startPointTime: number,
    responsePointIndex: number, 
    responsePointTime: number,
    T90: number,
    validArea: number[]
}
