(function () {
  'use strict';

  describe('space-summary-tile directive', function () {
    var $httpBackend, $uibModal, $q, element, controller, spaceModel, contextScope;

    var clusterGuid = 'guid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';

    var space = {
      metadata: {
        guid: spaceGuid
      },
      entity: {
        name: 'spaceName',
        allow_ssh: false
      }
    };
    var modelSpace = {
      details: {
        space: space,
        totalServiceInstances: 0,
        totalApps: 0
      }
    };
    var organization = {
      metadata: {
        guid: organizationGuid
      },
      entity: {
        name: 'orgName'
      },
      spaces: [ space ]
    };
    var userGuid = 'userGuid';

    beforeEach(module('templates'));
    beforeEach(module('console-app'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
    }));

    function initController($injector, role) {
      $httpBackend = $injector.get('$httpBackend');

      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;
      $stateParams.space = spaceGuid;

      var modelManager = $injector.get('modelManager');

      var cfOrganizationModel = $injector.get('cfOrganizationModel');
      _.set(cfOrganizationModel, 'organizations.' + clusterGuid + '.' + organization.metadata.guid, _.cloneDeep(organization));

      spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + space.metadata.guid, _.cloneDeep(modelSpace));

      var authModelOpts = {
        role: role,
        userGuid: userGuid,
        cnsiGuid: clusterGuid,
        spaceGuid: spaceGuid
      };

      mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);

      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + spaceGuid + '/routes?results-per-page=1')
        .respond({
          total_results: 0
        });
      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + spaceGuid + '/services?results-per-page=1')
        .respond({
          total_results: 0
        });

      var $compile = $injector.get('$compile');

      contextScope = $injector.get('$rootScope').$new();
      contextScope.space = {};

      var markup = '<space-summary-tile ' +
        'space="space">' +
        '</space-summary-tile>';

      element = angular.element(markup);
      $compile(element)(contextScope);

      contextScope.$apply();
      controller = element.controller('spaceSummaryTile');
    }

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('admin user', function () {

      beforeEach(inject(function ($injector) {
        initController($injector, 'admin');
        $httpBackend.flush();
      }));

      it('init', function () {
        expect(element).toBeDefined();
        expect(controller).toBeDefined();

        expect(controller.clusterGuid).toBe(clusterGuid);
        expect(controller.organizationGuid).toBe(organizationGuid);
        expect(controller.spaceGuid).toBe(spaceGuid);
        expect(controller.space).toBeDefined();
        expect(controller.cardData).toBeDefined();
        expect(controller.actions).toBeDefined();
        // Actions: rename, delete, enable/disable ssh
        expect(controller.actions.length).toEqual(3);
        expect(controller.getEndpoint).toBeDefined();
        expect(controller.showCliCommands).toBeDefined();
        expect(controller.spaceDetail).toBeDefined();
      });

      it('should have rename space enabled', function () {
        expect(controller.actions[0].disabled).toBeFalsy();
      });

      it('should have delete space enabled', function () {
        expect(controller.actions[1].disabled).toBeFalsy();
      });

      describe('Actions', function () {

        it('Rename space - valid input', function () {
          spyOn($uibModal, 'open').and.callFake(function (config) {
            expect(config.resolve.context().data.name).toEqual(space.entity.name);
            expect(config.resolve.context().data.spaceNames).toEqual([space.entity.name]);

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.reject('ERROR')
            };
          });

          controller.actions[0].execute();
        });

        it('Rename Space - reject', function () {
          spyOn(spaceModel, 'updateSpace');
          spyOn($uibModal, 'open').and.callFake(function () {
            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.reject('ERROR')
            };
          });

          controller.actions[0].execute();
          contextScope.$digest();

          expect(spaceModel.updateSpace).not.toHaveBeenCalled();
        });

        it('Rename Space - invalid output', function () {
          spyOn(spaceModel, 'updateSpace');
          spyOn($uibModal, 'open').and.callFake(function (config) {
            config.resolve.context().submitAction({
              name: ''
            });

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.resolve()
            };
          });

          controller.actions[0].execute();
          contextScope.$digest();

          expect(spaceModel.updateSpace).not.toHaveBeenCalled();
        });

        it('Rename Space - failed update', function () {
          spyOn(spaceModel, 'updateSpace').and.callFake(function (inClusterGuid, inOrgGuid, inSpaceGuid, inSpace) {
            expect(inClusterGuid).toEqual(clusterGuid);
            expect(inOrgGuid).toEqual(organizationGuid);
            expect(inSpaceGuid).toEqual(spaceGuid);
            expect(inSpace).toEqual({
              name: 'NEW_SPACE'
            });
            return $q.reject();
          });
          spyOn($uibModal, 'open').and.callFake(function (config) {
            config.resolve.context().submitAction({
              name: 'NEW_SPACE'
            });

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.resolve()
            };
          });

          controller.actions[0].execute();
          contextScope.$digest();

          expect(spaceModel.updateSpace).toHaveBeenCalled();
        });

        it('Rename Space - successful update', function () {
          spyOn(spaceModel, 'updateSpace').and.callFake(function () {
            return $q.resolve();
          });
          spyOn($uibModal, 'open').and.callFake(function (config) {
            config.resolve.context().submitAction({
              name: 'NEW_SPACE'
            });

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.resolve()
            };
          });

          controller.actions[0].execute();
          contextScope.$digest();

          expect(spaceModel.updateSpace).toHaveBeenCalled();
        });

      });
    });

    describe('non-admin user', function () {

      beforeEach(inject(function ($injector) {
        initController($injector, 'space_developer');
        $httpBackend.flush();
      }));

      it('should have no actions', function () {
        if (controller.actions) {
          expect(controller.actions.length).toBe(0);
        } else {
          expect(controller.actions).not.toBeDefined();
        }
      });
    });
  });

})();
