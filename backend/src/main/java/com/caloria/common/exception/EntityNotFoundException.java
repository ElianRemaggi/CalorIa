package com.caloria.common.exception;

public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(String entity, Object id) {
        super(entity + " not found with id: " + id);
    }
}
