'use strict'

const StatusCode ={
    FORBIDDEN: 403,
    CONFLICT: 409,
    AUTHFAILURE: 401,
    NOTFOUND: 404
}

const ReasonStatusCode = {
    BADREQUEST: 'Bad request error',
    CONFLICT: 'Conflict error',
    AUTHFAILURE: 'Auth error',
    NOTFOUND: 'NotFound Error',
    FORBIDDEN: 'Forbidden Error'
}


class ErrorResponse extends Error{

    constructor(message,status){
        super(message)
        this.status = status
    }
}

class ConflictRequestError extends ErrorResponse{
    constructor(message= ReasonStatusCode.CONFLICT,statusCode = StatusCode.CONFLICT){
        super(message,statusCode)
    }
}

class BadRequestError extends ErrorResponse{
    constructor(message= ReasonStatusCode.BADREQUEST,statusCode = StatusCode.FORBIDDEN){
        super(message,statusCode)
    }
}

class AuthFailureError extends ErrorResponse{
    constructor(message= ReasonStatusCode.AUTHFAILURE,statusCode = StatusCode.AUTHFAILURE){
        super(message,statusCode)
    }
}

class NotFoundError extends ErrorResponse{
    constructor(message= ReasonStatusCode.NOTFOUND,statusCode = StatusCode.NOTFOUND){
        super(message,statusCode)
    }
}

class ForbiddenError extends ErrorResponse{
    constructor(message= ReasonStatusCode.FORBIDDEN,statusCode = StatusCode.FORBIDDEN){
        super(message,statusCode)
    }
}

module.exports ={
    BadRequestError,
    ConflictRequestError,
    AuthFailureError,
    NotFoundError,
    ForbiddenError
}