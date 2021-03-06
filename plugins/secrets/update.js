'use strict';

const boom = require('boom');
const joi = require('joi');
const schema = require('screwdriver-data-schema');
const idSchema = joi.reach(schema.models.secret.base, 'id');

module.exports = () => ({
    method: 'PUT',
    path: '/secrets/{id}',
    config: {
        description: 'Update a secret',
        notes: 'Update a specific secret',
        tags: ['api', 'secrets'],
        auth: {
            strategies: ['token', 'session'],
            scope: ['user']
        },
        handler: (request, reply) => {
            const factory = request.server.app.secretFactory;
            const credentials = request.auth.credentials;
            const canAccess = request.server.plugins.secrets.canAccess;

            return factory.get(request.params.id)
                .then((secret) => {
                    if (!secret) {
                        throw boom.notFound('Secret does not exist');
                    }

                    // Make sure that user has permission before updating
                    return canAccess(credentials, secret, 'admin')
                        .then(() => {
                            Object.keys(request.payload).forEach((key) => {
                                secret[key] = request.payload[key];
                            });

                            return secret.update();
                        })
                        .then(() => {
                            const output = secret.toJson();

                            delete output.value;

                            return reply(output).code(200);
                        });
                })
                .catch(err => reply(boom.wrap(err)));
        },
        validate: {
            params: {
                id: idSchema
            },
            payload: schema.models.secret.update
        }
    }
});
