class APIError extends Error{
    isOPerational! : boolean;
    status!: number;

    constructor(
        status: number,
        isOperational: boolean,
        message?: string
    ) {
        super(message);
        this.status = status;
        this.isOPerational = isOperational;
        Object.setPrototypeOf(this, APIError.prototype);
    }
}

export default APIError;