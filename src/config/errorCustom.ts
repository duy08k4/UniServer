export type CustomError = {
    errorCode: string,
    message: string
}

export const CLASS_MEMBERSHIP_REQUIRED_403: CustomError = {
    errorCode: "CLASS_MEMBERSHIP_REQUIRED",
    message: "You is not a member in this class"
}
