import { useMemo } from "react";

export interface ResultBoxProperties {
    readonly resultBuffer: string;
}

/*
    For reference:
    AI Generated results will be a long string buffer of information
    this component will parse through and use.

    Here is the array buffer schema for the result string:
    [0]: Most Recommended Crop
    [1]: Top 3 Recommended Crops
    [2]: Worst 3 Recommended Crops
    [3]: 3 crops recommended per rotation (4 Rotations).
*/

export function ResultBox({
    resultBuffer,
}: ResultBoxProperties) {

    const parsedResult: Array<string> = useMemo(() => {
        return resultBuffer.split(';');
    }, [resultBuffer]);

    return(
        <main className="card">
            <div className="card-label">Results</div>
        </main>
    )
}

