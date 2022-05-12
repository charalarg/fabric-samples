export interface ILogin {
    message: string,
    user: {
        id: string,
        email: string,
        username: string
    },
    access_token: string
}
