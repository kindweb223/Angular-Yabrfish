/**=========================================================
 * tileController: Controller for My Tiles
 * used in My Tiles
 * Author: Ryan - 2015.11.20
 =========================================================*/
(function() {
    'use strict';

    angular
        .module('app.tiles', ['ngAnimate', 'ui.bootstrap'])        
        .controller('tileController', tileController);

    function tileController($scope, $http, $rootScope, $location, RouteHelpers, APP_APIS) {
      $scope.viewerId = 'B16EF381-81D1-4014-8BFA-AA7B082E0FD7';
      $scope.tiles = [];
      $scope.basepath = RouteHelpers.basepath;
      $scope.tileType = ['Event', 'Content', 'Offer', 'Sale', 'Business', 'Job', 'Swap', 'Poll'];
      $scope.newTile = {
        tileType: $scope.tileType[0],
        imageUrl: '',
        title: '',
        description: ''
      };
      $scope.accounts = [];
      $scope.organizations = [];

      // Slide Tile Creation Steps.
      var step_count = 3;
      $scope.stepWidth = angular.element('.new-tile-wrap').width();
      $scope.sliderWidth = angular.element('.new-tile-wrap').width() * step_count;
      $scope.transform = '';
      var translate = 0;
      $scope.index = 0;

      $scope.slideWrap = function(dir){
        if(dir === 'next'){
          $scope.index ++;
          translate -= $scope.stepWidth;
          $scope.transform = "translate("+translate+"px, 0px)";
        }else{
          $scope.index --;
          translate += $scope.stepWidth;
          $scope.transform = "translate("+translate+"px, 0px)";
        }
      }

      $scope.setFile = function(element) {
        $scope.currentFile = element.files[0];
         var reader = new FileReader();

        reader.onload = function(event) {
          $scope.image_source = event.target.result
          $scope.$apply()

        }
        // when the file is read it triggers the onload event above.
        reader.readAsDataURL(element.files[0]);
      }

      // Get Current User's Roles
      $http.get(APP_APIS['commerce']+'/viewers/'+$scope.viewerId+'/roles')
        .success(function(data){
          for(var i in data){            
            $scope.accounts.push(data[i].account);
          }
        });

      $scope.$watch('accountExternalId', function(newVal, oldVal){
        var accountId = newVal;
        for(var i in $scope.accounts){
          if( $scope.accounts[i].externalId == accountId )
            $scope.organizations = $scope.accounts[i].organizations;
        }
      })

      $scope.createTile = function() {
        // File Upload
        var file = $scope.currentFile;
        $http.post(APP_APIS['media']+'/images'+file)
          .success(function(response){
            console.log(response)
          }).error(function(status){
            console.log(status);
          });

        
        if(!$scope.newTile.description) $scope.newTile.description = '';
        if(!$scope.newTile.title) $scope.newTile.title = '';
        if(!$scope.newTile.tileType) $scope.newTile.tileType = '';
        if(!$scope.viewerId) $scope.viewerId = '';
        if(!$scope.accountExternalId) $scope.accountExternalId = '';
        if(!$scope.organizationExternalId) $scope.organizationExternalId = '';

        $scope.newTile.tileType = $scope.newTile.tileType.toUpperCase();
        var params = {
          "description": $scope.newTile.description,
          "name": $scope.newTile.title,
          "accountExternalId": $scope.accountExternalId,
          "tileType": $scope.newTile.tileType,
          "organizationExternalId": $scope.organizationExternalId,
          "viewerExternalId": $scope.viewerId,
          "isDeleted": false
        };

        // $http({
        //   method: 'POST',
        //   url: APP_APIS['tile'] + '/tiles',
        //   data: JSON.stringify(params),
        //   headers: {'Content-Type': 'application/json'}
        // }).success(function (data, status, headers, config){
        //   $location.path('app/tiles')
        // }).error(function (data, status, headers, config){
        //   console.log(status);
        // })
      }

      $scope.getTiles = function() {
        $http.get(APP_APIS['tile']+'/tiles/pure/'+ $scope.viewerId)
          .success(function(tiles){
            $scope.tiles = tiles;
            for(var i in $scope.tiles){
              //Get and change lowercase Tile Type.              
              $scope.tiles[i].tileType = $scope.tiles[i].tileType.toLowerCase();
            }
            console.log(tiles);
          })
      }
    }
})();