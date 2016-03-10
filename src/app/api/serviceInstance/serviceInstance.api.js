(function () {
  'use strict';

  /**
   * @namespace app.api
   * @memberOf app.api
   * @name app.api.serviceInstance
   * @description Service instance API
   */
  angular
    .module('app.api')
    .run(registerServiceInstanceApi);

  registerServiceInstanceApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerServiceInstanceApi($http, apiManager) {
    apiManager.register('app.api.serviceInstance', new ServiceInstanceApi($http));
  }

  /**
   * @namespace app.api
   * @memberof app.api.serviceInstance
   * @name app.api.serviceInstance.ServiceInstanceApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function ServiceInstanceApi($http) {
    this.$http = $http;
  }

  angular.extend(ServiceInstanceApi.prototype, {
    /**
     * @function connect
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Connect a service instance
     * @param {string} user - the Stratos user
     * @param {string} serviceInstance - the service instance name
     * @param {string} username - the service instance account username
     * @param {string} token - the access token
     * @param {number} expiresAt - when the token expires
     * @param {array} scope - the token scope
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    connect: function (user, serviceInstance, username, token, expiresAt, scope) {
      return this.$http.post('/api/service-instances/connect', {
        username: user,
        name: serviceInstance,
        service_user: username,
        service_token: token,
        expires_at: expiresAt,
        scope: scope
      });
    },

    /**
     * @function disconnect
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Disconnect user from service instance
     * @param {string} user - the Stratos user
     * @param {string} serviceInstance - the service instance name
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    disconnect: function (user, serviceInstance) {
      return this.$http.post('/api/service-instances/disconnect', {
        username: user,
        name: serviceInstance
      });
    },

    /**
     * @function list
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Returns a list of service instances for the user
     * @param {string} user - the Stratos user
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function (user) {
      return this.$http.get('/api/service-instances', {
        params: { username: user }
      });
    },

    /**
     * @function register
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Set the service instances as registered
     * @param {string} user - the Stratos user
     * @param {array} serviceInstanceNames - the service instance names
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    register: function (user, serviceInstanceNames) {
      return this.$http.post('/api/service-instances/register', {
        username: user,
        serviceInstances: serviceInstanceNames
      });
    }
  });

})();