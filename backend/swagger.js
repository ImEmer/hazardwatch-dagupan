import swaggerJSDoc from 'swagger-jsdoc';

const bearer = [{ bearerAuth: [] }];
const operation = (summary, tags, security = bearer, responses = ['200', '401', '403', '429']) => ({
  summary,
  tags,
  security,
  responses: Object.fromEntries(responses.map((status) => [status, { description: status === '200' ? 'Successful response.' : 'Error response.' }])),
});
const publicOperation = (summary, tags, responses = ['200', '400', '422']) => operation(summary, tags, [], responses);

const paths = {
  '/health': { get: publicOperation('Check API health.', ['Health']) },
  '/auth/check-email': { get: publicOperation('Check whether an email is registered.', ['Auth']) },
  '/auth/register': { post: publicOperation('Register a citizen account.', ['Auth'], ['201', '400', '422']) },
  '/auth/login': { post: publicOperation('Authenticate and issue a JWT.', ['Auth'], ['200', '400', '401', '429']) },
  '/auth/refresh': { post: operation('Issue a new JWT for the current user.', ['Auth']) },
  '/auth/logout': { post: operation('Record logout activity.', ['Auth']) },
  '/auth/me': { get: operation('Return the current user.', ['Auth']) },
  '/auth/change-password': { post: operation('Change the current password.', ['Auth'], bearer, ['200', '400', '401', '422']) },
  '/auth/profile': { put: operation('Update the current profile.', ['Auth'], bearer, ['200', '400', '401', '409', '422']) },
  '/auth/account': { delete: operation('Soft-delete the current account.', ['Auth'], bearer, ['200', '401']) },
  '/auth/forgot-password': { post: publicOperation('Request a password reset.', ['Auth'], ['200', '400']) },
  '/auth/reset-password': { post: publicOperation('Consume a password reset token.', ['Auth'], ['200', '400']) },
  '/reports/public': { get: publicOperation('List public reports.', ['Reports'], ['200', '422']) },
  '/reports/export': { get: operation('Export filtered reports as CSV.', ['Reports'], bearer, ['200', '401', '403']) },
  '/reports': {
    get: operation('List staff-visible reports.', ['Reports']),
    post: operation('Create a report with photo evidence.', ['Reports'], bearer, ['201', '400', '401', '422']) },
  '/reports/mine': { get: operation('List reports submitted by the current user.', ['Reports']) },
  '/reports/archived': { get: operation('List archived reports.', ['Reports']) },
  '/reports/{id}': {
    get: operation('Get a report by ID.', ['Reports'], bearer, ['200', '400', '401', '403', '404']),
    put: operation('Update a report.', ['Reports'], bearer, ['200', '400', '401', '403', '404']),
    delete: operation('Soft-delete a report.', ['Reports'], bearer, ['200', '400', '401', '403', '404']) },
  '/reports/{id}/status': { patch: operation('Update report status.', ['Reports'], bearer, ['200', '400', '401', '403', '404']) },
  '/reports/{id}/priority': { patch: operation('Update report priority.', ['Reports'], bearer, ['200', '400', '401', '403', '404']) },
  '/reports/{id}/assign': { patch: operation('Assign a report.', ['Reports'], bearer, ['200', '400', '401', '403', '404']) },
  '/reports/{id}/comments': { post: operation('Add a report comment.', ['Reports'], bearer, ['200', '400', '401', '403', '404']) },
  '/reports/bulk': { delete: operation('Soft-delete multiple reports.', ['Reports'], bearer, ['200', '400', '401', '403']) },
  '/users': {
    get: operation('List active users.', ['Users'], bearer, ['200', '401', '403']),
    post: operation('Create a managed user.', ['Users'], bearer, ['201', '400', '401', '403', '422']) },
  '/users/{id}': {
    get: operation('Get a managed user.', ['Users'], bearer, ['200', '400', '401', '403', '404']),
    put: operation('Update a managed user.', ['Users'], bearer, ['200', '400', '401', '403', '404']),
    delete: operation('Soft-delete a managed user.', ['Users'], bearer, ['200', '400', '401', '403', '404']) },
  '/users/{id}/status': { patch: operation('Toggle user active status.', ['Users'], bearer, ['200', '400', '401', '403', '404']) },
  '/users/{id}/suspend': { post: operation('Suspend a user.', ['Users'], bearer, ['200', '400', '401', '403', '404']) },
  '/users/{id}/ban': { post: operation('Permanently ban a user.', ['Users'], bearer, ['200', '400', '401', '403', '404']) },
  '/users/{id}/unsuspend': { post: operation('Unsuspend a user.', ['Users'], bearer, ['200', '400', '401', '403', '404']) },
  '/users/bulk': { delete: operation('Soft-delete multiple users.', ['Users'], bearer, ['200', '400', '401', '403']) },
  '/statistics/public': { get: publicOperation('Get public report statistics.', ['Statistics']) },
  '/statistics/overview': { get: operation('Get scoped report overview.', ['Statistics']) },
  '/statistics/categories': { get: operation('Get category counts.', ['Statistics']) },
  '/statistics/status': { get: operation('Get status counts.', ['Statistics']) },
  '/statistics/timeline': { get: operation('Get daily report counts.', ['Statistics']) },
  '/statistics/barangay': { get: operation('Get barangay counts.', ['Statistics']) },
  '/statistics/barangay/{barangay}': { get: operation('Get barangay overview.', ['Statistics']) },
  '/statistics/barangay/{barangay}/status': { get: operation('Get barangay status counts.', ['Statistics']) },
  '/statistics/barangay/{barangay}/priority': { get: operation('Get barangay priority counts.', ['Statistics']) },
  '/statistics/barangay/{barangay}/timeline': { get: operation('Get barangay timeline.', ['Statistics']) },
  '/notifications': { get: operation('List current-role notifications.', ['Notifications']) },
  '/notifications/{id}/read': { patch: operation('Mark a notification as read.', ['Notifications'], bearer, ['200', '401', '403', '404']) },
  '/activity/all': { get: operation('List all activity.', ['Activity'], bearer, ['200', '401', '403']) },
  '/activity/public': { get: operation('List public-scope activity.', ['Activity'], bearer, ['200', '401', '403']) },
  '/activity/barangay/{barangay}': { get: operation('List barangay activity.', ['Activity'], bearer, ['200', '401', '403']) },
  '/activity/me': { get: operation('List the current user activity.', ['Activity']) },
  '/activity': { get: operation('List activity according to caller role.', ['Activity']) },
  '/contact': {
    get: operation('List contact messages.', ['Contact'], bearer, ['200', '401', '403']),
    post: publicOperation('Submit a contact message.', ['Contact'], ['201', '400', '422']) },
  '/contact/{id}/status': { patch: operation('Update contact message status.', ['Contact'], bearer, ['200', '400', '401', '403', '404']) },
};

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'HazardWatch API',
    version: '1.0.0',
    description: 'HazardWatch Dagupan API. Protected endpoints use a JWT bearer token and role/barangay authorization.',
  },
  servers: [
    { url: 'http://localhost:5000/api', description: 'Local development' },
    { url: 'https://hazardwatch-dagupan.onrender.com/api', description: 'Deployed API' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
      Location: { type: 'object', required: ['coordinates'], properties: { type: { type: 'string', example: 'Point' }, coordinates: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number' }, example: [120.3333, 16.0433] } } },
      User: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['superadmin', 'admin', 'staff', 'barangay', 'user'] }, barangay: { type: 'string', nullable: true }, isActive: { type: 'boolean' } } },
      Report: { type: 'object', properties: { _id: { type: 'string' }, category: { type: 'string' }, description: { type: 'string' }, location: { $ref: '#/components/schemas/Location' }, status: { type: 'string', enum: ['Pending', 'In Progress', 'Resolved', 'Closed'] }, priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] } } },
    },
  },
  paths,
};

export const swaggerSpec = swaggerJSDoc({ definition: swaggerDefinition, apis: [] });
