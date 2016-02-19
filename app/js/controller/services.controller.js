/**=========================================================
 * Module: servicesController
 * Description: Controller for Services in Account profile page.
 * Author: Marcin - 2016-2-17
 =========================================================*/
(function() {
    'use strict';

    angular
        .module('app.profile-services', ['ngAnimate', 'ui.bootstrap'])
        .directive('servicePanel', function() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    ownerId: '='
                },
                controller: 'serviceController',
                templateUrl: 'app/views/partials/service-panel.html'
            };
        })
        .controller('serviceController', serviceController)    

    function serviceController($rootScope, $scope, AccountService) {

        $scope.services = AccountService.cacheServices();
        $scope.bServiceScrollDisabled = false;
        $scope.loading = false;

        $scope.getServices = function () {

            if ($scope.loading) {
                return;
            }

            $scope.loading = true;

            if ( ! AccountService.moreServices() ) {
                $scope.loading = false;
                $scope.bServiceScrollDisabled = true;
            } else {

                AccountService.getServices($scope.ownerId).then(function (data) {
                    $scope.services = AccountService.cacheServices();
                    $scope.loading = false;
                    $scope.bServiceScrollDisabled = true;
                }, function (error) {
                    console.log(error);
                    return;
                });
            }

        }
    }

})();
